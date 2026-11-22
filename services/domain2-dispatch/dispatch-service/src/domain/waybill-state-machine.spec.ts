import { BadRequestException } from '@nestjs/common';
import { WaybillStateMachine } from './waybill-state-machine';

describe('WaybillStateMachine', () => {
  it('blocks skip transition CREATED -> DELIVERED with 400 (TC-12)', () => {
    expect(() =>
      WaybillStateMachine.validateTransition('CREATED', 'DELIVERED', 0),
    ).toThrow(BadRequestException);
  });

  it('allows standard 7-state progression', () => {
    expect(() =>
      WaybillStateMachine.validateTransition('CREATED', 'WAITING_FOR_PICKUP', 0),
    ).not.toThrow();
    expect(() =>
      WaybillStateMachine.validateTransition('WAITING_FOR_PICKUP', 'PICKED_UP', 0),
    ).not.toThrow();
    expect(() =>
      WaybillStateMachine.validateTransition('PICKED_UP', 'IN_TRANSIT', 0),
    ).not.toThrow();
    expect(() =>
      WaybillStateMachine.validateTransition('IN_TRANSIT', 'OUT_FOR_DELIVERY', 0),
    ).not.toThrow();
    expect(() =>
      WaybillStateMachine.validateTransition('OUT_FOR_DELIVERY', 'DELIVERED', 0),
    ).not.toThrow();
    expect(() =>
      WaybillStateMachine.validateTransition('OUT_FOR_DELIVERY', 'FAILED', 0),
    ).not.toThrow();
  });

  it('blocks re-delivery when deliveryAttempts >= 3', () => {
    expect(() =>
      WaybillStateMachine.validateTransition('FAILED', 'OUT_FOR_DELIVERY', 3),
    ).toThrow(BadRequestException);
  });
});
