// Shared front-end logic and page-specific bindings
(function(){
  function el(sel){return document.querySelector(sel)}
  function els(sel){return Array.from(document.querySelectorAll(sel))}

  function renderMenuList(container, menus){
    container.innerHTML = '';
    menus.forEach(m=>{
      const card = document.createElement('div'); card.className='menu-card';
      card.innerHTML = `<h4>${m.menu_name}</h4><p>${m.description}</p><div class="price">Rp ${m.price.toLocaleString()}</div><div style="margin-top:.6rem"><a class="btn" href="order.html?menu=${m.menu_id}">Pilih</a></div>`;
      container.appendChild(card);
    })
  }

  function initMenuPage(){
    const container = el('#menu-list');
    if(!container) return;
    PSApi.getMenuList().then(menus=>renderMenuList(container, menus));
  }

  function initOrderPage(){
    const form = el('#order-form');
    const menuTitle = el('#order-menu-title');
    const url = new URL(window.location.href);
    const menuId = Number(url.searchParams.get('menu'));
    if(menuId){
      PSApi.getMenuList().then(menus=>{
        const m = menus.find(x=>x.menu_id===menuId);
        if(m) menuTitle.textContent = m.menu_name + ' — Rp '+m.price.toLocaleString();
      })
    }

    if(!form) return;
    // auto-fill customer_id from session; redirect to login if not logged in
    try{
      const cur = PSApi.getCurrentCustomer && PSApi.getCurrentCustomer();
      if(!cur){
        alert('Silakan login untuk memulai order');
        window.location.href = 'login.html';
        return;
      }
      form.customerId.value = cur.customer_id;
    }catch(e){console.warn(e)}

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data = {
        customer_id: Number(form.customerId.value||0),
        menu_id: menuId||Number(form.menuId.value),
        portion: Number(form.portion.value),
        note: form.note.value,
        delivery_date: form.deliveryDate.value,
      };
      // simple validation
      if(!data.customer_id || !data.menu_id || !data.delivery_date){
        alert('Lengkapi data order'); return;
      }
      PSApi.placeOrder({customer_id:data.customer_id, items:[{menu_id:data.menu_id, portion:data.portion, note:data.note}], total_price:0, delivery_date:data.delivery_date})
        .then(order=>{
          window.location.href = 'summary.html?order='+encodeURIComponent(order.order_id);
        }).catch(err=>alert(err.message||err));
    })
  }

  function initSummaryPage(){
    const url = new URL(window.location.href);
    const oid = url.searchParams.get('order');
    const elBox = el('#summary'); if(!elBox) return;
    PSApi.getOrderDetail(oid).then(order=>{
      if(!order){ elBox.textContent='Order tidak ditemukan'; return }
      const deliveryDate = order.delivery_date || '-';
      const note = order.note || '-';
      elBox.innerHTML = `<h3>Order ${order.order_id}</h3><div>Status: <strong>${order.status}</strong></div><div>Tanggal kirim: ${deliveryDate}</div><div>Catatan: ${note}</div><div style="margin-top:.5rem"><a class="btn" href="upload_payment.html?order=${encodeURIComponent(order.order_id)}">Upload Bukti Pembayaran</a></div>`;
    })
  }

  function initUploadPayment(){
    const url = new URL(window.location.href); const oid = url.searchParams.get('order');
    const form = el('#upload-form'); if(!form) return;
    el('#upload-order-id').textContent = oid;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const file = el('#proof').files[0];
      if(!file){ alert('Pilih file'); return }
      // read file as data URL (simulate upload)
      const reader = new FileReader();
      reader.onload = ()=>{
        PSApi.uploadPayment({order_id:oid, upload_proof:reader.result}).then(()=>{
          alert('Bukti dikirim. Status: Waiting for Validation');
          window.location.href='status.html?order='+encodeURIComponent(oid);
        }).catch(err=>alert(err.message||err))
      };
      reader.readAsDataURL(file);
    })
  }

  function initStatusPage(){
    const url=new URL(window.location.href); const oid=url.searchParams.get('order');
    const box = el('#status-box'); if(!box) return;
      function renderStatus(){
        PSApi.getOrderDetail(oid).then(o=>{
          if(!o) {box.textContent='Order not found'; return}
          fetch(PSApi.BASE_URL + '/payments.php', {credentials:'include'})
            .then(res=>res.json())
            .then(payments=>{
              // Find latest payment for this order
              const payment = Array.isArray(payments) ? payments.filter(p=>p.order_id===o.order_id).sort((a,b)=>b.payment_id-a.payment_id)[0] : payments;
              let paymentStatus = 'No payment yet';
              if(payment && payment.status) {
                if(payment.status==='Waiting for Validation') paymentStatus = 'Waiting for Validation';
                else if(payment.status==='Approved') paymentStatus = 'Approved';
                else if(payment.status==='Rejected') paymentStatus = 'Rejected';
                else paymentStatus = payment.status;
              }
              box.innerHTML=`<h3>Order ${o.order_id}</h3><div>Status: <strong>${o.status}</strong></div><div>Payment: ${paymentStatus}</div>`;
            })
            .catch(()=>{
              box.innerHTML=`<h3>Order ${o.order_id}</h3><div>Status: <strong>${o.status}</strong></div><div>Payment: No payment yet</div>`;
            });
        })
      }
      renderStatus();
      // Listen for admin validation events (optional: polling for status update)
      setInterval(renderStatus, 3000);
  }

  function initCustomerDashboard(){
    const box = el('#customer-orders'); if(!box) return;
    // prefer currently logged-in customer
    let customerId = 0;
    try{
      const cur = PSApi.getCurrentCustomer && PSApi.getCurrentCustomer();
      if(cur){ customerId = Number(cur.customer_id); }
      else { alert('Silakan login untuk melihat dashboard'); window.location.href='login.html'; return }
    }catch(e){ console.warn(e) }
    PSApi.getOrdersByCustomer(customerId).then(orders=>{
      if(!orders.length) {box.textContent='Belum ada order'; return}
      const t = document.createElement('table'); t.className='table';
      t.innerHTML = `<thead><tr><th>Order</th><th>Tanggal</th><th>Status</th><th></th></tr></thead>`;
      const tbody = document.createElement('tbody');
      orders.forEach(o=>{ 
        const tr=document.createElement('tr'); 
        const date = o.order_date ? o.order_date.split('T')[0] : 'N/A';
        tr.innerHTML=`<td>${o.order_id}</td><td>${date}</td><td>${o.status}</td><td><a href="summary.html?order=${encodeURIComponent(o.order_id)}">Detail</a></td>`; 
        tbody.appendChild(tr) 
      });
      t.appendChild(tbody); box.appendChild(t);
    })
  }

  // Admin pages
  function initAdminMenuManage(){
    const list = el('#admin-menu-list'); if(!list) return;
    PSApi.getMenuList().then(menus=>{
      list.innerHTML='';
      menus.forEach(m=>{
        const tr = document.createElement('div'); tr.className='card'; tr.style.marginBottom='8px';
        tr.innerHTML = `<strong>${m.menu_name}</strong> — Rp ${m.price.toLocaleString()} <div class="small">${m.description}</div><div style="margin-top:.5rem"><a href="#" data-id="${m.menu_id}" class="btn edit">Edit</a> <a href="#" data-id="${m.menu_id}" class="btn btn-outline del">Delete</a></div>`;
        list.appendChild(tr);
      })
      list.addEventListener('click', e=>{
        if(e.target.classList.contains('del')){
          const id = Number(e.target.dataset.id);
          if(confirm('Hapus menu?')) PSApi.deleteMenu(id).then(()=>initAdminMenuManage());
        }
      })
    })
  }

  function initAdminPayments(){
    const box = el('#pending-payments'); if(!box) return;
    PSApi.getPendingPayments().then(list=>{
      if(!list.length) {box.textContent='No pending payments'; return}
      list.forEach(p=>{
        const card = document.createElement('div'); card.className='card';
        card.innerHTML = `<h4>Payment ${p.payment_id}</h4><div>Order: ${p.order_id}</div><div>Status: ${p.status}</div><div style="margin-top:.5rem"><a class="btn" href="payments.html?order=${encodeURIComponent(p.order_id)}">Open</a></div>`;
        box.appendChild(card);
      })
    })
  }

  // initialize based on presence of elements
  document.addEventListener('DOMContentLoaded', ()=>{
    // skip logout UI on landing page (index.html)
    const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/pagi_sore_frontend/');
    
    if(!isLandingPage){
      // session UI: add logout link if user/admin is logged in (only on customer/admin pages)
      try{
        const user = PSApi.getCurrentCustomer && PSApi.getCurrentCustomer();
        const isAdmin = PSApi.isAdminLoggedIn && PSApi.isAdminLoggedIn();
        const nav = document.querySelector('.site-header nav');
        // compute safe index.html URL within the project
        function computeIndexUrl(){
          try{
            const path = window.location.pathname || '';
            const marker = '/pagi_sore_frontend';
            const idx = path.indexOf(marker);
            let newPath = null;
            if(idx !== -1){
              newPath = path.slice(0, idx + marker.length) + '/index.html';
            } else {
              newPath = path.replace(/\/[^\/]*$/, '') + '/index.html';
            }
            if(window.location.protocol === 'file:'){
              return 'file://' + newPath;
            }
            return (window.location.origin || '') + newPath;
          }catch(e){ return 'index.html' }
        }

        const indexUrl = computeIndexUrl();
        if(nav){
            console.log('Debug: user=', user, 'isAdmin=', isAdmin);
            if(user && !isAdmin){
              const span = document.createElement('span'); span.className='small'; span.style.marginLeft='1rem'; span.textContent = 'Hi, '+(user.name||user.email);
              nav.appendChild(span);
              const out = document.createElement('a'); out.href='#'; out.textContent='Logout'; out.style.marginLeft='.8rem'; out.className='btn btn-outline logout';
              out.addEventListener('click', e=>{ e.preventDefault(); PSApi.logout().then(()=>{ alert('Logged out'); window.location.href=indexUrl; }) });
              nav.appendChild(out);
            } else if(isAdmin){
              console.log('Adding logout button for admin...');
              const out = document.createElement('a'); out.href='#'; out.textContent='Logout'; out.style.marginLeft='.8rem'; out.className='btn btn-outline logout';
              out.addEventListener('click', e=>{ e.preventDefault(); PSApi.logout().then(()=>{ alert('Admin logged out'); window.location.href=indexUrl; }) });
              nav.appendChild(out);
              console.log('Logout button added');
            }
        }
      }catch(e){console.warn(e)}
    }
    
    initMenuPage(); initOrderPage(); initSummaryPage(); initUploadPayment(); initStatusPage(); initCustomerDashboard(); initAdminMenuManage(); initAdminPayments();
  });

})();
