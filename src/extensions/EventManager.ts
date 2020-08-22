import { PlayableAnimationEvent, PlayableAnimation } from '../animations/PlayableAnimation';
import { FrameBasedAnimationTimer } from '../animations';
import { FrameBasedAnimationEvent } from '../animations/FrameBasedAnimationTimer';

/**
 * This module partially defines the map control.
 * This definition only includes the features added by using the drawing tools.
 * For the base definition see:
 * https://docs.microsoft.com/javascript/api/azure-maps-control/?view=azure-maps-typescript-latest
 */
declare module "azure-maps-control" {
    /**
     * This interface partially defines the map control's `EventManager`.
     * This definition only includes the method added by using the drawing tools.
     * For the base definition see:
     * https://docs.microsoft.com/javascript/api/azure-maps-control/atlas.eventmanager?view=azure-maps-typescript-latest
     */
    export interface EventManager {
        /**
         * Adds an event to the `PlayableAnimation`.
         * @param eventType The event name.
         * @param target The `PlayableAnimation` to add the event for.
         * @param callback The event handler callback.
         */
        add(eventType: "onprogress", target: PlayableAnimation, callback: (e: PlayableAnimationEvent) => void): void;

        /**
         * Adds an event to the `PlayableAnimation`.
         * @param eventType The event name.
         * @param target The `PlayableAnimation` to add the event for.
         * @param callback The event handler callback.
         */
        add(eventType: "oncomplete", target: PlayableAnimation, callback: (e: PlayableAnimationEvent) => void): void;

        /**
         * Adds an event to the `FrameBasedAnimationTimer`.
         * @param eventType The event name.
         * @param target The `FrameBasedAnimationTimer` to add the event for.
         * @param callback The event handler callback.
         */
        add(eventType: "onframe", target: FrameBasedAnimationTimer, callback: (e: FrameBasedAnimationEvent) => void): void;

        /**
         * Adds an event to the `PlayableAnimation` once.
         * @param eventType The event name.
         * @param target The `PlayableAnimation` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "onprogress", target: PlayableAnimation, callback: (e: PlayableAnimationEvent) => void): void;

        /**
         * Adds an event to the `PlayableAnimation` once.
         * @param eventType The event name.
         * @param target The `PlayableAnimation` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "oncomplete", target: PlayableAnimation, callback: (e: PlayableAnimationEvent) => void): void;
        
        /**
         * Adds an event to the `FrameBasedAnimationTimer` once.
         * @param eventType The event name.
         * @param target The `FrameBasedAnimationTimer` to add the event for.
         * @param callback The event handler callback.
         */
        addOnce(eventType: "onframe", target: FrameBasedAnimationTimer, callback: (e: FrameBasedAnimationEvent) => void): void;

        /**
         * Removes an event listener from the `PlayableAnimation`.
         * @param eventType The event name.
         * @param target The `PlayableAnimation` to remove the event for.
         * @param callback The event handler callback.
         */
        remove(eventType: string, target: PlayableAnimation, callback: (e?: any) => void): void;

        /**
         * Removes an event listener from the `FrameBasedAnimationTimer`.
         * @param eventType The event name.
         * @param target The `FrameBasedAnimationTimer` to remove the event for.
         * @param callback The event handler callback.
         */
        remove(eventType: string, target: FrameBasedAnimationTimer, callback: (e?: any) => void): void;
    }
}
