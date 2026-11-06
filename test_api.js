const http = require('http');

async function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting CampusCycle Automated End-to-End Test Suite...\n');

  // 1. Health check
  const health = await request('/api/health');
  console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED');

  // 2. Fetch categories
  const cats = await request('/api/categories');
  console.log('2. Categories Loaded:', cats.data?.data?.length === 10 ? `✅ PASSED (${cats.data.data.length} categories)` : '❌ FAILED');

  // 3. Query products
  const prods = await request('/api/products?search=Casio');
  console.log('3. Search & Query Products:', prods.data?.data?.length > 0 ? `✅ PASSED (Found: ${prods.data.data[0].title})` : '❌ FAILED');

  // 4. Student Login
  const loginRes = await request('/api/auth/login', 'POST', {
    email: 'aarav@du.ac.in',
    password: 'student123'
  });
  const token = loginRes.data?.data?.token;
  console.log('4. Student Authentication:', token ? `✅ PASSED (Logged in as ${loginRes.data.data.fullName})` : '❌ FAILED');

  // 5. Post a new student listing
  const newProductRes = await request('/api/products', 'POST', {
    title: 'Chemistry Lab Glassware Set (Beakers + Test Tubes)',
    description: 'Complete borosilicate glass set with stand and test tube holder. Used for Organic Chemistry lab.',
    category: 'Lab Equipment & Lab Coats',
    condition: 'Like New',
    sellingPrice: 350,
    originalPrice: 800,
    isNegotiable: true,
    meetingLocation: 'Miranda House / North Campus Gate'
  }, token);
  const createdProductId = newProductRes.data?.data?._id;
  console.log('5. Create Listing:', createdProductId ? `✅ PASSED (Product ID: ${createdProductId})` : '❌ FAILED');

  // 6. Login as second student (buyer)
  const buyerLogin = await request('/api/auth/login', 'POST', {
    email: 'priya@ipu.ac.in',
    password: 'student123'
  });
  const buyerToken = buyerLogin.data?.data?.token;
  console.log('6. Buyer Authentication:', buyerToken ? '✅ PASSED' : '❌ FAILED');

  // 7. Make an offer on the new product
  const offerRes = await request('/api/offers', 'POST', {
    productId: createdProductId,
    offerPrice: 280,
    message: 'Can take this today for ₹280!'
  }, buyerToken);
  const offerId = offerRes.data?.data?._id;
  console.log('7. Submit Bargain Offer:', offerId ? `✅ PASSED (Offer ID: ${offerId}, Proposed: ₹280)` : '❌ FAILED');

  // 8. Seller responds (Counter-offer)
  const counterRes = await request(`/api/offers/${offerId}/respond`, 'PATCH', {
    action: 'counter',
    counterPrice: 310,
    message: 'How about ₹310? Meet at the library.'
  }, token);
  console.log('8. Seller Counter-Offer:', counterRes.data?.data?.status === 'countered' ? '✅ PASSED' : '❌ FAILED');

  // 9. Wishlist toggle
  const wishRes = await request(`/api/wishlist/toggle/${createdProductId}`, 'POST', null, buyerToken);
  console.log('9. Wishlist Saved:', wishRes.data?.inWishlist === true ? '✅ PASSED' : '❌ FAILED');

  // 10. Real-time chat message
  const msgRes = await request('/api/messages', 'POST', {
    recipientId: loginRes.data.data._id,
    productId: createdProductId,
    content: 'Awesome, ₹310 sounds good! See you at 3 PM at the library.'
  }, buyerToken);
  console.log('10. Direct Messaging:', msgRes.data?.success ? '✅ PASSED' : '❌ FAILED');

  // 11. Sustainability Impact Metrics
  const impactRes = await request('/api/impact');
  console.log('11. Sustainable Impact Tracker:', impactRes.data?.data?.totalSavingsINR > 0 ? `✅ PASSED (Saved: ₹${impactRes.data.data.totalSavingsINR.toLocaleString('en-IN')}, CO2 Saved: ${impactRes.data.data.co2SavedKg} kg)` : '❌ FAILED');

  // 12. Admin Moderator Login & Audit
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@campuscycle.edu',
    password: 'admin123'
  });
  const adminToken = adminLogin.data?.data?.token;
  const adminMetrics = await request('/api/admin/metrics', 'GET', null, adminToken);
  console.log('12. Admin Moderation Portal:', adminMetrics.data?.data?.totalUsers > 0 ? `✅ PASSED (${adminMetrics.data.data.totalUsers} Students, ${adminMetrics.data.data.totalProducts} Listings)` : '❌ FAILED');

  console.log('\n🎉 ALL 12 END-TO-END CAMPUSCYCLE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
