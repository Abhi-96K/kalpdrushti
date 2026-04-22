import json
import os
import uuid
from datetime import datetime

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional

from models.database import Base, engine, get_db
from models.schemas import (
    PaymentCheckoutRequest,
    PaymentCheckoutResponse,
    PaymentSessionDB,
    PaymentSessionResponse,
)

Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/payments", tags=["payments"])

PLANS = {
    "premium": {
        "label": "Premium",
        "name": "Kalpdrushti Premium",
        "amount": 1900,
        "currency": "usd",
        "price_env": "STRIPE_PREMIUM_PRICE_ID",
    },
    "studio": {
        "label": "Studio",
        "name": "Kalpdrushti Studio",
        "amount": 4900,
        "currency": "usd",
        "price_env": "STRIPE_STUDIO_PRICE_ID",
    },
}


def _configure_stripe() -> None:
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY in the backend environment.",
        )
    stripe.api_key = secret_key


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _get_plan(plan_id: str) -> dict:
    plan = PLANS.get(plan_id.lower())
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown payment plan.")
    return plan


def _line_item_for_plan(plan: dict) -> dict:
    price_id = os.getenv(plan["price_env"])
    if price_id:
        return {"price": price_id, "quantity": 1}

    return {
        "price_data": {
            "currency": plan["currency"],
            "product_data": {"name": plan["name"]},
            "unit_amount": plan["amount"],
            "recurring": {"interval": "month"},
        },
        "quantity": 1,
    }


def _value(obj, key: str, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _session_status(session) -> str:
    subscription = _value(session, "subscription")
    if hasattr(subscription, "status"):
        return subscription.status
    if isinstance(subscription, dict):
        return subscription.get("status", "unknown")
    return _value(session, "payment_status") or _value(session, "status", "unknown")


def _sync_session(session, db: Session) -> PaymentSessionDB:
    metadata = _value(session, "metadata", {}) or {}
    payment_id = metadata.get("payment_id")
    db_payment = None

    if payment_id:
        db_payment = db.query(PaymentSessionDB).filter(PaymentSessionDB.id == payment_id).first()

    if not db_payment:
        db_payment = (
            db.query(PaymentSessionDB)
            .filter(PaymentSessionDB.stripe_session_id == _value(session, "id"))
            .first()
        )

    if not db_payment:
        db_payment = PaymentSessionDB(
            id=payment_id or str(uuid.uuid4()),
            plan=metadata.get("plan", "premium"),
        )
        db.add(db_payment)

    customer = _value(session, "customer")
    subscription = _value(session, "subscription")
    customer_details = _value(session, "customer_details")

    db_payment.stripe_session_id = _value(session, "id")
    db_payment.stripe_customer_id = _value(customer, "id", customer)
    db_payment.stripe_subscription_id = _value(subscription, "id", subscription)
    db_payment.plan = metadata.get("plan", db_payment.plan)
    db_payment.status = _session_status(session)
    db_payment.customer_email = (
        _value(session, "customer_email")
        or _value(customer_details, "email")
        or db_payment.customer_email
    )
    db_payment.amount_total = _value(session, "amount_total")
    db_payment.currency = _value(session, "currency") or db_payment.currency
    db_payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_payment)
    return db_payment


def _payment_response(db_payment: PaymentSessionDB) -> PaymentSessionResponse:
    plan = PLANS.get(db_payment.plan, PLANS["premium"])
    return PaymentSessionResponse(
        session_id=db_payment.stripe_session_id or "",
        plan=db_payment.plan,
        plan_label=plan["label"],
        status=db_payment.status,
        customer_email=db_payment.customer_email,
        amount_total=db_payment.amount_total,
        currency=db_payment.currency,
    )


@router.post("/checkout", response_model=PaymentCheckoutResponse)
def create_checkout_session(
    payload: PaymentCheckoutRequest,
    db: Session = Depends(get_db),
):
    _configure_stripe()
    plan_id = payload.plan.lower()
    plan = _get_plan(plan_id)
    payment_id = str(uuid.uuid4())
    frontend_url = _frontend_url()

    db_payment = PaymentSessionDB(
        id=payment_id,
        plan=plan_id,
        status="checkout_created",
        customer_email=payload.customer_email,
        amount_total=plan["amount"],
        currency=plan["currency"],
    )
    db.add(db_payment)
    db.commit()

    session_params = {
        "mode": "subscription",
        "line_items": [_line_item_for_plan(plan)],
        "success_url": f"{frontend_url}/premium?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{frontend_url}/premium?checkout=cancelled",
        "allow_promotion_codes": True,
        "metadata": {"payment_id": payment_id, "plan": plan_id},
        "subscription_data": {"metadata": {"payment_id": payment_id, "plan": plan_id}},
    }

    if payload.customer_email:
        session_params["customer_email"] = payload.customer_email
        session_params["client_reference_id"] = payload.customer_email

    try:
        session = stripe.checkout.Session.create(**session_params)
    except stripe.error.StripeError as exc:
        db_payment.status = "checkout_failed"
        db_payment.updated_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    db_payment.stripe_session_id = session.id
    db_payment.updated_at = datetime.utcnow()
    db.commit()

    return PaymentCheckoutResponse(checkout_url=session.url, session_id=session.id)


@router.get("/checkout-session/{session_id}", response_model=PaymentSessionResponse)
def get_checkout_session(session_id: str, db: Session = Depends(get_db)):
    _configure_stripe()

    try:
        session = stripe.checkout.Session.retrieve(session_id, expand=["subscription"])
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    db_payment = _sync_session(session, db)
    return _payment_response(db_payment)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(default=None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    _configure_stripe()
    payload = await request.body()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
        else:
            event = json.loads(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe payload.") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.") from exc

    event_type = event["type"]
    event_object = event["data"]["object"]

    if event_type in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.expired",
    }:
        _sync_session(event_object, db)

    if event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        subscription_id = event_object["id"]
        db_payment = (
            db.query(PaymentSessionDB)
            .filter(PaymentSessionDB.stripe_subscription_id == subscription_id)
            .first()
        )
        if db_payment:
            db_payment.status = event_object.get("status", db_payment.status)
            db_payment.updated_at = datetime.utcnow()
            db.commit()

    return {"received": True}
