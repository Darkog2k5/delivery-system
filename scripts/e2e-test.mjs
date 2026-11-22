import assert from 'node:assert/strict';

const GATEWAY = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const timings = [];
const results = [];

async function apiCall(name, path, options = {}) {
  const start = performance.now();
  const res = await fetch(`${GATEWAY}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const elapsedMs = Math.round((performance.now() - start) * 100) / 100;
  timings.push({ name, elapsedMs });
  const body = await res.json();
  assert.equal(typeof body.status, 'number', `${name}: missing standard status field`);
  assert.equal(typeof body.message, 'string', `${name}: missing standard message field`);
  assert.ok('data' in body, `${name}: missing standard data field`);
  return { httpStatus: res.status, body, elapsedMs };
}

function record(tc, title, detail) {
  results.push({ tc, title, detail });
  console.log(`PASS [${tc}] ${title} -> ${detail}`);
}

async function runAll() {
  console.log(`=== SPX-CLONE-2026 END-TO-END TEST SUITE (12 TEST CASES) ===`);
  console.log(`Target API Gateway: ${GATEWAY}\n`);

  // TC-01: Register new account & block duplicate phone
  const testPhone = '0901234567';
  let reg1 = await apiCall('TC-01-register-1', '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Shop Kiểm Thử TC01',
      phone: testPhone,
      password: 'Password123',
      role: 'CUSTOMER',
    }),
  });
  let effectivePhone = testPhone;
  if (reg1.httpStatus === 409) {
    effectivePhone = `090${Math.floor(1000000 + Math.random() * 8999999)}`;
    reg1 = await apiCall('TC-01-register-fresh', '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Shop Kiểm Thử TC01',
        phone: effectivePhone,
        password: 'Password123',
        role: 'CUSTOMER',
      }),
    });
  }
  assert.equal(reg1.httpStatus, 201);
  assert.equal(reg1.body.data.user.role, 'ROLE_CUSTOMER');

  const reg2 = await apiCall('TC-01-register-dup', '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Shop Kiểm Thử TC01',
      phone: effectivePhone,
      password: 'Password123',
      role: 'CUSTOMER',
    }),
  });
  assert.equal(reg2.httpStatus, 409);
  record('TC-01', 'Đăng ký tài khoản mới & chặn trùng SĐT', `201 Created -> 409 Conflict (${effectivePhone})`);

  // TC-02: Login 3 roles (Shop, Shipper, Admin)
  const shopLogin = await apiCall('TC-02-login-shop', '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'SHOP_01', password: '123456' }),
  });
  assert.equal(shopLogin.httpStatus, 200);
  assert.equal(shopLogin.body.data.user.role, 'ROLE_CUSTOMER');
  const shopToken = shopLogin.body.data.accessToken;

  const shipperLogin = await apiCall('TC-02-login-shipper', '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'SHIPPER_01', password: '123456' }),
  });
  assert.equal(shipperLogin.httpStatus, 200);
  assert.equal(shipperLogin.body.data.user.role, 'ROLE_SHIPPER');
  const shipperToken = shipperLogin.body.data.accessToken;

  const adminLogin = await apiCall('TC-02-login-admin', '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'ADMIN_01', password: '123456' }),
  });
  assert.equal(adminLogin.httpStatus, 200);
  assert.equal(adminLogin.body.data.user.role, 'ROLE_ADMIN');
  const adminToken = adminLogin.body.data.accessToken;
  record('TC-02', 'Đăng nhập & cấp JWT theo 3 vai trò RBAC', 'ROLE_CUSTOMER, ROLE_SHIPPER, ROLE_ADMIN -> 200 OK');

  // TC-03: Security RBAC test — Customer calling Admin Dispatch Assign blocked at Gateway with 403
  const forbiddenRes = await apiCall('TC-03-rbac-403', '/api/dispatch/assign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${shopToken}` },
    body: JSON.stringify({ trackingCode: 'SPX20260501001', shipperCode: 'SHIPPER_01' }),
  });
  assert.equal(forbiddenRes.httpStatus, 403);
  assert.equal(forbiddenRes.body.data.errorCode, 'ERR_FORBIDDEN');
  record('TC-03', 'Bảo mật RBAC tại Gateway: Customer gọi API Admin', '403 Forbidden (ERR_FORBIDDEN)');

  // TC-04: Automatic shipping fee calculation (Quận 1 -> TP. Thủ Đức, 2.5 kg, 30x20x15 cm)
  const feeRes = await apiCall('TC-04-fee', '/api/orders/calculate-fee', {
    method: 'POST',
    body: JSON.stringify({
      senderDistrict: 'Quận 1',
      receiverDistrict: 'TP. Thủ Đức',
      actualWeightGram: 2500,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
    }),
  });
  assert.equal(feeRes.httpStatus, 200);
  assert.equal(feeRes.body.data.volumetricWeightGram, 1800);
  assert.equal(feeRes.body.data.chargeableWeightGram, 2500);
  assert.ok(feeRes.body.data.shippingFee > 15000);
  record('TC-04', 'Tính cước tự động Haversine & thể tích', `Distance=${feeRes.body.data.distanceKm}km, Fee=${feeRes.body.data.shippingFee}đ`);

  // TC-05: Shop creates new order (COD = 500,000đ) & retrieves A6 label (UC06 + UC09)
  const createOrderRes = await apiCall('TC-05-create-order', '/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${shopToken}` },
    body: JSON.stringify({
      senderAddress: '120 Lê Lợi',
      senderDistrict: 'Quận 1',
      receiverName: 'Nguyễn Thị E2E',
      receiverPhone: '0909555666',
      receiverAddress: '88 Võ Văn Ngân',
      receiverDistrict: 'TP. Thủ Đức',
      itemName: 'Áo Khoác E2E Test',
      actualWeightGram: 2500,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
      codAmount: 500000,
      note: 'Kiểm thử E2E TC-05',
    }),
  });
  assert.equal(createOrderRes.httpStatus, 201);
  const createdCode = createOrderRes.body.data.trackingCode;
  assert.ok(createdCode.startsWith('SPX'));
  assert.equal(createOrderRes.body.data.orderStatus, 'CREATED');

  const labelRes = await apiCall('TC-05-label', `/api/orders/${createdCode}/label`, {
    headers: { Authorization: `Bearer ${shopToken}` },
  });
  assert.equal(labelRes.httpStatus, 200);
  assert.equal(labelRes.body.data.barcodeFormat, 'CODE128');
  assert.equal(labelRes.body.data.paperSizeMm, '100x150');
  record('TC-05', 'Shop tạo vận đơn mới & sinh tem in A6', `${createdCode} -> 201 Created & Label A6 OK`);

  // TC-06: Public tracking without token (SPX20260501089 -> 200, SPX999 -> 404) + newly created order
  const pubOk = await apiCall('TC-06-public-ok', '/api/tracking/SPX20260501089');
  assert.equal(pubOk.httpStatus, 200);
  assert.ok(Array.isArray(pubOk.body.data.timeline) && pubOk.body.data.timeline.length >= 4);

  const pub404 = await apiCall('TC-06-public-404', '/api/tracking/SPX999');
  assert.equal(pub404.httpStatus, 404);

  // Also ensure created order propagated via SAGA event to Tracking & Dispatch
  await new Promise((r) => setTimeout(r, 300));
  const pubNew = await apiCall('TC-06-new-order-track', `/api/tracking/${createdCode}`);
  assert.equal(pubNew.httpStatus, 200);
  assert.equal(pubNew.body.data.currentStatus, 'CREATED');
  record('TC-06', 'Tra cứu công khai không cần đăng nhập', 'SPX20260501089 -> 200 OK; SPX999 -> 404 Not Found');

  // TC-07: Admin Master Dashboard & Assign to SHIPPER_01
  const dashRes = await apiCall('TC-07-dashboard', '/api/dispatch/dashboard?status=CREATED', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(dashRes.httpStatus, 200);
  assert.ok(dashRes.body.data.orders.some((o) => o.trackingCode === createdCode));

  const assignStart = performance.now();
  const assignRes = await apiCall('TC-07-assign', '/api/dispatch/assign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ trackingCode: createdCode, shipperCode: 'SHIPPER_01' }),
  });
  assert.equal(assignRes.httpStatus, 200);
  assert.equal(assignRes.body.data.orderStatus, 'WAITING_FOR_PICKUP');
  await new Promise((r) => setTimeout(r, 250));
  const trackAfterAssign = await apiCall('TC-07-track-sync', `/api/tracking/${createdCode}`);
  const eventLatencyMs = Math.round(performance.now() - assignStart);
  assert.equal(trackAfterAssign.body.data.currentStatus, 'WAITING_FOR_PICKUP');
  record('TC-07', 'Admin Master Dashboard & Gán đơn cho SHIPPER_01', `WAITING_FOR_PICKUP synced in ~${eventLatencyMs}ms`);

  // TC-08: Shipper toggles Online & views Pickup Orders
  const onlineRes = await apiCall('TC-08-online', '/api/dispatch/shipper/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ isOnline: true }),
  });
  assert.equal(onlineRes.httpStatus, 200);
  assert.equal(onlineRes.body.data.isOnline, true);

  const pickupListRes = await apiCall('TC-08-pickup-list', '/api/dispatch/shipper/orders?tab=pickup', {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  assert.equal(pickupListRes.httpStatus, 200);
  assert.ok(pickupListRes.body.data.some((o) => o.trackingCode === createdCode));
  record('TC-08', 'Shipper bật Online & xem danh sách đơn cần lấy', `Found ${createdCode} in WAITING_FOR_PICKUP`);

  // TC-09: Shipper scans barcode & confirms pickup
  const pickupConfirmRes = await apiCall('TC-09-pickup', `/api/dispatch/orders/${createdCode}/pickup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ scannedBarcode: createdCode }),
  });
  assert.equal(pickupConfirmRes.httpStatus, 200);
  assert.equal(pickupConfirmRes.body.data.orderStatus, 'PICKED_UP');
  await new Promise((r) => setTimeout(r, 200));
  const trackAfterPickup = await apiCall('TC-09-track-sync', `/api/tracking/${createdCode}`);
  assert.equal(trackAfterPickup.body.data.currentStatus, 'PICKED_UP');
  record('TC-09', 'Shipper quét Barcode xác nhận lấy hàng', `${createdCode} -> PICKED_UP synced to Tracking`);

  // Advance PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> TC-10 Delivered
  const transitRes1 = await apiCall('TC-10-in-transit', `/api/dispatch/orders/${createdCode}/transit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ targetStatus: 'IN_TRANSIT' }),
  });
  assert.equal(transitRes1.httpStatus, 200);

  const transitRes2 = await apiCall('TC-10-out-for-delivery', `/api/dispatch/orders/${createdCode}/transit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ targetStatus: 'OUT_FOR_DELIVERY' }),
  });
  assert.equal(transitRes2.httpStatus, 200);

  const deliverRes = await apiCall('TC-10-deliver', `/api/dispatch/orders/${createdCode}/deliver`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ receiverSignature: 'Nguyễn Thị E2E', codCollected: true }),
  });
  assert.equal(deliverRes.httpStatus, 200);
  assert.equal(deliverRes.body.data.orderStatus, 'DELIVERED');
  await new Promise((r) => setTimeout(r, 200));
  const trackAfterDeliver = await apiCall('TC-10-track-sync', `/api/tracking/${createdCode}`);
  assert.equal(trackAfterDeliver.body.data.currentStatus, 'DELIVERED');
  record('TC-10', 'Shipper xác nhận Giao thành công (UC20)', `${createdCode} -> DELIVERED synced across domains`);

  // TC-11: Shipper reports delivery failure with mandatory reason (SPX20260501007 is OUT_FOR_DELIVERY)
  const failRes = await apiCall('TC-11-fail', '/api/dispatch/orders/SPX20260501007/fail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${shipperToken}` },
    body: JSON.stringify({ reason: 'Không liên lạc được với người nhận' }),
  });
  assert.equal(failRes.httpStatus, 200);
  assert.equal(failRes.body.data.orderStatus, 'FAILED');
  await new Promise((r) => setTimeout(r, 200));
  const trackAfterFail = await apiCall('TC-11-track-sync', '/api/tracking/SPX20260501007');
  assert.equal(trackAfterFail.body.data.currentStatus, 'FAILED');
  assert.equal(trackAfterFail.body.data.failReason, 'Không liên lạc được với người nhận');
  record('TC-11', 'Shipper báo cáo Giao thất bại kèm lý do (UC21)', 'SPX20260501007 -> FAILED + failReason recorded');

  // TC-12: State Machine skips blocked (CREATED -> DELIVERED returns 400 Bad Request)
  const skipDispatchRes = await apiCall('TC-12-skip-dispatch', '/api/dispatch/orders/SPX20260501001/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ targetStatus: 'DELIVERED' }),
  });
  assert.equal(skipDispatchRes.httpStatus, 400);
  assert.equal(skipDispatchRes.body.data.errorCode, 'ERR_INVALID_STATE_TRANSITION');

  const skipOrderRes = await apiCall('TC-12-skip-order', '/api/orders/SPX20260501001/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ targetStatus: 'DELIVERED' }),
  });
  assert.equal(skipOrderRes.httpStatus, 400);
  assert.equal(skipOrderRes.body.data.errorCode, 'ERR_INVALID_STATE_TRANSITION');
  record('TC-12', 'Chặn cập nhật nhảy cóc trạng thái (CREATED -> DELIVERED)', '400 Bad Request (ERR_INVALID_STATE_TRANSITION) ở cả Miền 1 & Miền 2');

  const avgMs = Math.round((timings.reduce((s, t) => s + t.elapsedMs, 0) / timings.length) * 100) / 100;
  const maxMs = Math.max(...timings.map((t) => t.elapsedMs));
  console.log(`\n=== SUMMARY ===`);
  console.log(`Passed Test Cases: ${results.length}/12`);
  console.log(`API Response Time (NFR-01): avg=${avgMs}ms, max=${maxMs}ms (target < 500ms)`);
}

runAll().catch((err) => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
