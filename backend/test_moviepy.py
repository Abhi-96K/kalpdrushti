from moviepy import __version__, ImageClip, TextClip, AudioFileClip, CompositeVideoClip
print("MoviePy version:", __version__)

try:
    # Test v2 API
    txt = TextClip(text="Hello", font_size=70, color="white", font="Arial", size=(800, None), method="caption")
    txt = txt.with_position(('center', 'bottom')).with_start(0).with_end(1)
    print("TextClip Success!")
except Exception as e:
    print("TextClip Error:", repr(e))
