// Pagi Sore Catering API — OOAD Compliant
// Uses OOAD class & database field names
(function(global){
  // Auto-detect base URL
  function getBaseUrl(){
    const path = window.location.pathname || '';
    const marker = '/pagi_sore_frontend';
    const idx = path.indexOf(marker);
    if(idx !== -1){
      const base = path.slice(0, idx + marker.length);
      const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
      return origin + base;
    }
    return window.location.origin + path.replace(/\/[^\/]*$/, '');
  }

  const BASE_URL = getBaseUrl() + '/backend/php';
  
  // ===== DEMO DATA STORAGE (Fallback) =====
  let STORAGE = {
    customers: [
      {customer_id:1, name:'user', phone:'0812345678', address:'Jakarta', password:'user123'}
    ],
    admin: [
      {admin_id:1, name:'Admin', username:'admin', password:'admin'}
    ],
    menu: [
      {menu_id:1, menu_name:'Paket Hemat', description:'Nasi + 2 lauk', price:25000, category:'Breakfast'},
      {menu_id:2, menu_name:'Paket Spesial', description:'Nasi + 3 lauk + buah', price:40000, category:'Lunch'},
      {menu_id:3, menu_name:'Paket Event', description:'Buffet untuk 20 orang', price:800000, category:'Catering'}
    ],
    orders: [],
    order_items: [],
    payments: [],
    delivery: []
  };

  try{
    const raw = localStorage.getItem('PSStorage');
    if(raw){
      try{
        const loaded = JSON.parse(raw);
        // Safely merge only order-related data, preserve structure
        if(loaded.orders) STORAGE.orders = loaded.orders;
        if(loaded.order_items) STORAGE.order_items = loaded.order_items;
        if(loaded.payments) STORAGE.payments = loaded.payments;
        if(loaded.delivery) STORAGE.delivery = loaded.delivery;
        // Keep admin, customers, menu as defaults (never load from corrupted localStorage)
      }catch(e){ console.warn('Storage parse error', e); }
    }
  }catch(e){ console.warn('Storage load failed', e) }

  function saveStorage(){
    try{ localStorage.setItem('PSStorage', JSON.stringify(STORAGE)); }catch(e){}
  }

  function delay(result, ms=300){ return new Promise(res=>setTimeout(()=>res(result),ms)); }

  // Generate unique order ID
  function generateOrderId(){
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2,5);
  }

  // ===== CUSTOMER CLASS METHODS =====

  async function customerRegister({name, phone, address, password}){
    try{
      const res = await fetch(BASE_URL + '/register.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name, phone, address, password})
      });
      if(!res.ok) throw new Error(await res.text());
      const customer = await res.json();
      try{ localStorage.setItem('PSCurrentCustomer', JSON.stringify(customer)); }catch(e){}
      return {customer};
    }catch(e){
      console.warn('PHP register failed, using demo', e);
      if(STORAGE.customers.find(c=>c.name===name)) return Promise.reject({message:'User sudah terdaftar'});
      const customer = {customer_id:Date.now(), name, phone, address, password};
      STORAGE.customers.push(customer);
      saveStorage();
      try{ localStorage.setItem('PSCurrentCustomer', JSON.stringify(customer)); }catch(e){}
      return delay({customer});
    }
  }

  async function customerLogin({name, password}){
    try{
      const res = await fetch(BASE_URL + '/login.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name, password}),
        credentials:'include'
      });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      try{ localStorage.setItem('PSCurrentCustomer', JSON.stringify(data.customer)); }catch(e){}
      return data;
    }catch(e){
      console.warn('PHP login failed, using demo', e);
      const customer = STORAGE.customers.find(c=>c.name===name && c.password===password);
      if(!customer) return Promise.reject({message:'Invalid credentials'});
      try{ localStorage.setItem('PSCurrentCustomer', JSON.stringify(customer)); }catch(e){}
      return delay({customer});
    }
  }

  async function adminLogin({username, password}){
    try{
      const res = await fetch(BASE_URL + '/admin_login.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username, password}),
        credentials:'include'
      });
      if(!res.ok) throw new Error(await res.text());
      try{ localStorage.setItem('PSAdmin', '1'); }catch(e){}
      return await res.json();
    }catch(e){
      console.warn('PHP admin login failed, using demo', e);
      const admin = STORAGE.admin.find(a=>a.username===username && a.password===password);
      if(!admin) return Promise.reject({message:'Invalid admin credentials'});
      try{ localStorage.setItem('PSAdmin', '1'); }catch(e){}
      return delay({ok:true, admin});
    }
  }

  // ===== MENU CLASS METHODS =====

  async function getMenuList(){
    try{
      const res = await fetch(BASE_URL + '/menus.php');
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getMenuList failed, using demo', e);
      return delay(STORAGE.menu.slice());
    }
  }

  async function addMenu({menu_name, description, price, category}){
    try{
      const res = await fetch(BASE_URL + '/menus.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({menu_name, description, price, category})
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP addMenu failed, using demo', e);
      const menu = {menu_id:Date.now(), menu_name, description, price, category};
      STORAGE.menu.push(menu);
      saveStorage();
      return delay(menu);
    }
  }

  async function editMenu({menu_id, menu_name, description, price, category}){
    try{
      const res = await fetch(BASE_URL + '/menus.php', {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({menu_id, menu_name, description, price, category})
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP editMenu failed, using demo', e);
      const m = STORAGE.menu.find(x=>x.menu_id===menu_id);
      if(!m) return Promise.reject({message:'Menu not found'});
      Object.assign(m, {menu_name, description, price, category});
      saveStorage();
      return delay(m);
    }
  }

  async function deleteMenu(menu_id){
    try{
      const res = await fetch(BASE_URL + '/menus.php', {
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({menu_id})
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP deleteMenu failed, using demo', e);
      STORAGE.menu = STORAGE.menu.filter(m=>m.menu_id!==menu_id);
      saveStorage();
      return delay({ok:true});
    }
  }

  // ===== ORDER CLASS METHODS =====

  async function placeOrder({customer_id, items, total_price, delivery_date}){
    try{
      const order_id = generateOrderId();
      const res = await fetch(BASE_URL + '/orders.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({customer_id, total_price, delivery_date, status:'Pending'})
      });
      if(!res.ok) throw new Error(await res.text());
      const order = await res.json();
      return Object.assign({}, order, {status:'Pending'});
    }catch(e){
      console.warn('PHP placeOrder failed, using demo', e);
      const order_id = generateOrderId();
      const order = {
        order_id,
        customer_id,
        total_price,
        order_date: new Date().toISOString(),
        delivery_date,
        status:'Pending'
      };
      STORAGE.orders.push(order);
      // Add order items
      if(items && items.length){
        items.forEach(item=>{
          STORAGE.order_items.push({
            item_id: Date.now() + Math.random(),
            order_id,
            menu_id: item.menu_id,
            portion: item.portion,
            note: item.note
          });
        });
      }
      saveStorage();
      return delay(order);
    }
  }

  async function getOrdersByCustomer(customer_id){
    try{
      const res = await fetch(BASE_URL + '/orders.php?customer_id=' + customer_id);
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getOrdersByCustomer failed, using demo', e);
      return delay(STORAGE.orders.filter(o=>o.customer_id===customer_id));
    }
  }

  async function getOrderDetail(order_id){
    try{
      const res = await fetch(BASE_URL + '/orders.php?order_id=' + order_id);
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getOrderDetail failed, using demo', e);
      return delay(STORAGE.orders.find(o=>o.order_id===order_id));
    }
  }

  async function getAllOrders(){
    try{
      const res = await fetch(BASE_URL + '/orders.php', {credentials:'include'});
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getAllOrders failed, using demo', e);
      return delay(STORAGE.orders.slice());
    }
  }

  // ===== PAYMENT CLASS METHODS =====

  async function uploadPayment({order_id, upload_proof}){
    try{
      const res = await fetch(BASE_URL + '/upload_payment.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({order_id, upload_proof})
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP uploadPayment failed, using demo', e);
      const payment = {
        payment_id: Date.now(),
        order_id,
        upload_proof,
        timestamp: new Date().toISOString(),
        verified_by: null,
        status:'Pending'
      };
      STORAGE.payments.push(payment);
      saveStorage();
      return delay(payment);
    }
  }

  async function getPendingPayments(){
    try{
      // Query for payments waiting for admin validation
      const res = await fetch(BASE_URL + '/payments.php?status=Waiting%20for%20Validation', {credentials:'include'});
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getPendingPayments failed, using demo', e);
      return delay(STORAGE.payments.filter(p=>p.status==='Waiting for Validation' || p.status==='Pending'));
    }
  }

  async function validatePayment({payment_id, order_id, verified_by, status}){
    try{
      const res = await fetch(BASE_URL + '/validate_payment.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({payment_id, order_id, verified_by, status}),
        credentials:'include'
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP validatePayment failed, using demo', e);
      const payment = STORAGE.payments.find(p=>p.payment_id===payment_id);
      if(!payment) return Promise.reject({message:'Payment not found'});
      payment.verified_by = verified_by;
      payment.status = status; // 'Approved' or 'Rejected'
      saveStorage();
      return delay(payment);
    }
  }

  // ===== DELIVERY CLASS METHODS =====

  async function scheduleDelivery({order_id, deliver_time, driver, address}){
    try{
      const res = await fetch(BASE_URL + '/delivery.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({order_id, deliver_time, driver, address})
      });
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP scheduleDelivery failed, using demo', e);
      const delivery = {
        delivery_id: Date.now(),
        order_id,
        deliver_time,
        driver,
        address,
        status:'Scheduled'
      };
      STORAGE.delivery.push(delivery);
      saveStorage();
      return delay(delivery);
    }
  }

  async function getDeliveryList(){
    try{
      const res = await fetch(BASE_URL + '/delivery.php', {credentials:'include'});
      if(!res.ok) throw new Error(await res.text());
      return await res.json();
    }catch(e){
      console.warn('PHP getDeliveryList failed, using demo', e);
      return delay(STORAGE.delivery.slice());
    }
  }

  // ===== SESSION HELPERS =====

  function getCurrentCustomer(){
    try{ const raw = localStorage.getItem('PSCurrentCustomer'); return raw?JSON.parse(raw):null }catch(e){return null}
  }

  function isAdminLoggedIn(){
    return !!localStorage.getItem('PSAdmin');
  }

  async function logout(){
    try{ localStorage.removeItem('PSCurrentCustomer'); localStorage.removeItem('PSAdmin'); }catch(e){}
    return delay({ok:true});
  }

  // ===== EXPOSE API =====
  global.PSApi = {
    BASE_URL,
    // Customer methods
    customerRegister, customerLogin, getCurrentCustomer,
    // Admin methods
    adminLogin,
    // Menu methods
    getMenuList, addMenu, editMenu, deleteMenu,
    // Order methods
    placeOrder, getOrdersByCustomer, getOrderDetail, getAllOrders,
    // Payment methods
    uploadPayment, getPendingPayments, validatePayment,
    // Delivery methods
    scheduleDelivery, getDeliveryList,
    // Session
    isAdminLoggedIn, logout
  };
})(window);

