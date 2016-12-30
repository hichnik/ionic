import { assert } from '../util/util';
import { Platform, EventListenerOptions } from '../platform/platform';

/**
 * @private
 */
export class PointerEvents {
  private rmTouchStart: Function = null;
  private rmTouchMove: Function = null;
  private rmTouchEnd: Function = null;
  private rmTouchCancel: Function = null;

  private rmMouseStart: Function = null;
  private rmMouseMove: Function = null;
  private rmMouseUp: Function = null;

  private bindTouchEnd: any;
  private bindMouseUp: any;

  private lastTouchEvent: number = 0;

  mouseWait: number = 2 * 1000;
  lastEventType: PointerEventType = PointerEventType.UNDEFINED;

  constructor(
    private plt: Platform,
    private ele: any,
    private pointerDown: any,
    private pointerMove: any,
    private pointerUp: any,
    private option: EventListenerOptions
  ) {
    assert(ele, 'element can not be null');
    assert(pointerDown, 'pointerDown can not be null');

    this.bindTouchEnd = this.handleTouchEnd.bind(this);
    this.bindMouseUp = this.handleMouseUp.bind(this);

    this.rmTouchStart = this.plt.addListener(ele, 'touchstart', this.handleTouchStart.bind(this), option);
    this.rmMouseStart = this.plt.addListener(ele, 'mousedown', this.handleMouseDown.bind(this), option);
  }

  private handleTouchStart(ev: any) {
    assert(this.ele, 'element can not be null');
    assert(this.pointerDown, 'pointerDown can not be null');

    this.lastTouchEvent = Date.now() + this.mouseWait;
    this.lastEventType = PointerEventType.TOUCH;
    if (!this.pointerDown(ev, PointerEventType.TOUCH)) {
      return;
    }
    if (!this.rmTouchMove && this.pointerMove) {
      this.rmTouchMove = this.plt.addListener(this.ele, 'touchmove', this.pointerMove, this.option);
    }
    if (!this.rmTouchEnd) {
      this.rmTouchEnd = this.plt.addListener(this.ele, 'touchend', this.bindTouchEnd, this.option);
    }
    if (!this.rmTouchCancel) {
      this.rmTouchCancel = this.plt.addListener(this.ele, 'touchcancel', this.bindTouchEnd, this.option);
    }
  }

  private handleMouseDown(ev: any) {
    assert(this.ele, 'element can not be null');
    assert(this.pointerDown, 'pointerDown can not be null');

    if (this.lastTouchEvent > Date.now()) {
      console.debug('mousedown event dropped because of previous touch');
      return;
    }
    this.lastEventType = PointerEventType.MOUSE;
    if (!this.pointerDown(ev, PointerEventType.MOUSE)) {
      return;
    }
    if (!this.rmMouseMove && this.pointerMove) {
      this.rmMouseMove = this.plt.addListener(this.plt.doc(), 'mousemove', this.pointerMove, this.option);
    }
    if (!this.rmMouseUp) {
      this.rmMouseUp = this.plt.addListener(this.plt.doc(), 'mouseup', this.bindMouseUp, this.option);
    }
  }

  private handleTouchEnd(ev: any) {
    this.stopTouch();
    this.pointerUp && this.pointerUp(ev, PointerEventType.TOUCH);
  }

  private handleMouseUp(ev: any) {
    this.stopMouse();
    this.pointerUp && this.pointerUp(ev, PointerEventType.MOUSE);
  }

  private stopTouch() {
    this.rmTouchMove && this.rmTouchMove();
    this.rmTouchEnd && this.rmTouchEnd();
    this.rmTouchCancel && this.rmTouchCancel();

    this.rmTouchMove = this.rmTouchEnd = this.rmTouchCancel = null;
  }

  private stopMouse() {
    this.rmMouseMove && this.rmMouseMove();
    this.rmMouseUp && this.rmMouseUp();

    this.rmMouseMove = this.rmMouseUp = null;
  }

  stop() {
    this.stopTouch();
    this.stopMouse();
  }

  destroy() {
    this.rmTouchStart && this.rmTouchStart();
    this.rmMouseStart && this.rmMouseStart();
    this.stop();
    this.ele = this.pointerUp = this.pointerMove = this.pointerDown = this.rmTouchStart = this.rmMouseStart = null;
  }

}


export const enum PointerEventType {
  UNDEFINED,
  MOUSE,
  TOUCH
}

export interface PointerEventsConfig {
  element?: HTMLElement;
  pointerDown: (ev: any) => boolean;
  pointerMove?: (ev: any) => void;
  pointerUp?: (ev: any) => void;
  zone?: boolean;
  capture?: boolean;
  passive?: boolean;
}
