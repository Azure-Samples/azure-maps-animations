# Animation Module

A rich library of animations for use with the Azure Maps Web SDK.

Most animations are based on the `IPlayableAnimation` interface and accept `PlayableAnimationOptions` which makes it easy customize how these animations function.

Check out the [API Reference](API%20Reference.md) for indepth details.

## Easings

The following easing names can be used with the animation library. Check out the [Animation easings](https://azuremapscodesamples.azurewebsites.net/index.html?sample=Animation%20easings) example to see these in action.

| Name | Description |
|------|-------------|
| `linear` | linear easing function. |
| `easeInSine` | Slight acceleration from zero to full speed. |
| `easeOutSine` | Slight deceleration at the end. |
| `easeInOutSine` | Slight acceleration at beginning and slight deceleration at end. |
| `easeInQuad` | Accelerating from zero velocity. |
| `easeOutQuad` | Decelerating to zero velocity. |
| `easeInOutQuad` | Acceleration until halfway, then deceleration. |
| `easeInCubic` | Accelerating from zero velocity. |
| `easeOutCubic` | Decelerating to zero velocity. |
| `easeInOutCubic` | Acceleration until halfway, then deceleration. |
| `easeInQuart` | Accelerating from zero velocity. |
| `easeOutQuart` | Decelerating to zero velocity. |
| `easeInOutQuart` | Acceleration until halfway, then deceleration. |
| `easeInQuint` | Accelerating from zero velocity. |
| `easeOutQuint` | Decelerating to zero velocity. |
| `easeInOutQuint` | Acceleration until halfway, then deceleration. |
| `easeInExpo` | Accelerate exponentially until finish. |
| `easeOutExpo` | Initial exponential acceleration slowing to stop. |
| `easeInOutExpo` | Exponential acceleration and deceleration. |
| `easeInCirc` | Increasing velocity until stop. |
| `easeOutCirc` | Start fast, decreasing velocity until stop. |
| `easeInOutCirc` | Fast increase in velocity, fast decrease in velocity. |
| `easeInBack` | Slow movement backwards then fast snap to finish.  |
| `easeOutBack` | Fast snap to backwards point then slow resolve to finish. |
| `easeInOutBack` | Slow movement backwards, fast snap to past finish, slow resolve to finish. |
| `easeInElastic` | Bounces slowly then quickly to finish. |
| `easeOutElastic` | Fast acceleration, bounces to zero. |
| `easeInOutElastic` | Slow start and end, two bounces sandwich a fast motion. |
| `easeOutBounce` | Bounce to completion. |
| `easeInBounce` | Bounce increasing in velocity until completion. |
| `easeInOutBounce` | Bounce in and bounce out. |
