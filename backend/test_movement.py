from moviepy import ImageClip, __version__, ColorClip
import moviepy.video.fx as vfx

print("Testing MoviePy Zoom Effect (v" + __version__ + ")")
try:
    clip = ColorClip(size=(1920, 1080), color=(255, 0, 0), duration=2)

    def resize_func(t):
        return 1.0 + 0.05 * t

    zoomed = clip.with_effects([vfx.Resize(resize_func)])
    cropped = zoomed.cropped(x_center=zoomed.w/2, y_center=zoomed.h/2, width=1920, height=1080)

    cropped.save_frame("test_zoom.jpg", t=1.0)
    print("RESIZED SUCCESS")
except Exception as e:
    print("RESIZED ERROR:", repr(e))
