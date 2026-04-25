// src/supabaseClient.js
// Initializes the Supabase connection for La Tavola

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rxvvlsvayacjkqhgpoux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m4GflHDxK5JN_xfxa5Aa0w_pVimYuFd';

// Create a single Supabase client for the entire app
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Your restaurant's unique ID (matches what we inserted in SQL)
export const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

// Helper: generate a simple order number like ORD-12345
export const genOrderNumber = () => 'ORD-' + Math.floor(10000 + Math.random() * 90000);

// ---- ORDER HELPERS ----------------------------------------------------------

export async function saveOrderToDb(order) {
  const { data, error } = await supabase.from('orders').insert({
    order_number: order.id,
    restaurant_id: RESTAURANT_ID,
    branch_id: order.branchId || null,
    customer_name: order.customer,
    customer_phone: order.phone || null,
    items: order.items,
    subtotal: order.subtotal || order.total,
    delivery_fee: order.deliveryFee || 0,
    discount: order.discount || 0,
    tip: order.tip || 0,
    total: order.total,
    status: order.status || 'pending',
    type: order.type || 'dine-in',
    paid: order.paid || false,
    pay_method: order.payMethod || null,
    address: order.address || null,
    slot: order.slot || null,
    taken_by: order.takenBy || null,
    source: order.source || 'online',
    notes: order.notes || null,
    table_id: order.tableId || null,
    delivery_code: order.deliveryCode || null,
    code_method: order.codeMethod || 'app',
  }).select().single();
  if (error) console.error('saveOrderToDb error:', error);
  return { data, error };
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) console.error('fetchOrders error:', error);
  return data || [];
}

export async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('order_number', orderId);
  if (error) console.error('updateOrderStatus error:', error);
}

export async function updateOrderPayment(orderId, paid, payMethod) {
  const { error } = await supabase
    .from('orders')
    .update({ paid: paid, pay_method: payMethod })
    .eq('order_number', orderId);
  if (error) console.error('updateOrderPayment error:', error);
}

// ---- CUSTOMER HELPERS -------------------------------------------------------

export async function findCustomerByPhone(phone) {
  const clean = phone.replace(/\s+/g, '');
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('phone', clean)
    .maybeSingle();
  if (error) console.error('findCustomerByPhone error:', error);
  return data;
}

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchCustomers error:', error);
  return data || [];
}

export async function saveCustomer(customer) {
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: RESTAURANT_ID,
    phone: customer.phone,
    name: customer.name,
    email: customer.email || null,
    address: customer.address || {},
    distance: customer.distance || null,
    notes: customer.notes || null,
  }).select().single();
  if (error) console.error('saveCustomer error:', error);
  return { data, error };
}

export async function updateCustomerStats(customerId, orderTotal) {
  const { data: existing } = await supabase
    .from('customers')
    .select('total_orders, total_spent')
    .eq('id', customerId)
    .single();
  if (!existing) return;
  await supabase.from('customers').update({
    total_orders: (existing.total_orders || 0) + 1,
    total_spent: (parseFloat(existing.total_spent) || 0) + orderTotal,
  }).eq('id', customerId);
}

// ---- MENU HELPERS -----------------------------------------------------------

export async function fetchMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID);
  if (error) console.error('fetchMenu error:', error);
  return data || [];
}

export async function saveMenuItem(item) {
  // Save menu item with category name directly
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: item.name,
    description: item.desc || null,
    price: parseFloat(item.price),
    icon: item.icon || 'cart',
    stock: parseInt(item.stock) || 20,
    available: item.avail !== false,
    allergens: item.allergens || [],
    sizes: item.sizes || [],
    extras: item.extras || [],
    cooking_opts: item.cookingOpts || [],
    category_name: item.cat || 'Mains',
    station: item.station || null,
  };
  
  // If item has a UUID id (from database), update. Otherwise insert.
  if (item.dbId) {
    const { data, error } = await supabase.from('menu_items')
      .update(payload)
      .eq('id', item.dbId)
      .select().single();
    if (error) console.error('updateMenuItem error:', error);
    return { data, error };
  } else {
    const { data, error } = await supabase.from('menu_items')
      .insert(payload)
      .select().single();
    if (error) console.error('insertMenuItem error:', error);
    return { data, error };
  }
}

export async function deleteMenuItem(dbId) {
  const { error } = await supabase.from('menu_items').delete().eq('id', dbId);
  if (error) console.error('deleteMenuItem error:', error);
  return { error };
}

// ---- CATEGORY HELPERS -------------------------------------------------------

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('display_order', { ascending: true });
  if (error) console.error('fetchCategories error:', error);
  return data || [];
}

export async function saveCategory(cat) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: cat.name,
    icon: cat.icon || 'star',
    display_order: parseInt(cat.order) || 99,
  };
  
  if (cat.dbId) {
    const { data, error } = await supabase.from('categories')
      .update(payload)
      .eq('id', cat.dbId)
      .select().single();
    if (error) console.error('updateCategory error:', error);
    return { data, error };
  } else {
    const { data, error } = await supabase.from('categories')
      .insert(payload)
      .select().single();
    if (error) console.error('insertCategory error:', error);
    return { data, error };
  }
}

export async function deleteCategory(dbId) {
  const { error } = await supabase.from('categories').delete().eq('id', dbId);
  if (error) console.error('deleteCategory error:', error);
  return { error };
}

// ---- SET MEAL HELPERS -------------------------------------------------------

export async function fetchSetMeals() {
  const { data, error } = await supabase
    .from('set_meals')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID);
  if (error) console.error('fetchSetMeals error:', error);
  return data || [];
}

export async function saveSetMeal(meal) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: meal.name,
    description: meal.desc || null,
    price: parseFloat(meal.price),
    icon: meal.icon || 'party',
    item_ids: meal.itemIds || [],
    available: meal.avail !== false,
  };
  
  if (meal.dbId) {
    const { data, error } = await supabase.from('set_meals')
      .update(payload)
      .eq('id', meal.dbId)
      .select().single();
    if (error) console.error('updateSetMeal error:', error);
    return { data, error };
  } else {
    const { data, error } = await supabase.from('set_meals')
      .insert(payload)
      .select().single();
    if (error) console.error('insertSetMeal error:', error);
    return { data, error };
  }
}

export async function deleteSetMeal(dbId) {
  const { error } = await supabase.from('set_meals').delete().eq('id', dbId);
  if (error) console.error('deleteSetMeal error:', error);
  return { error };
}

// ---- REVIEW HELPERS ---------------------------------------------------------

export async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) console.error('fetchReviews error:', error);
  return data || [];
}

export async function submitReview(review) {
  const { error } = await supabase.from('reviews').insert({
    restaurant_id: RESTAURANT_ID,
    customer_name: review.customer,
    rating: review.rating,
    comment: review.comment,
  });
  if (error) console.error('submitReview error:', error);
}

// ---- REALTIME SUBSCRIPTIONS -------------------------------------------------

export function subscribeToOrders(onChange) {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => onChange(payload)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ---- OPENING HOURS ----------------------------------------------------------
export async function fetchOpeningHours(branchId) {
  const { data, error } = await supabase.from('opening_hours')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('branch_id', branchId)
    .order('day_of_week');
  if (error) console.error('fetchOpeningHours:', error);
  return data || [];
}

export async function saveOpeningHours(branchId, dayOfWeek, openTime, closeTime, isClosed) {
  // Upsert: delete old then insert new (simpler than upsert for our case)
  await supabase.from('opening_hours')
    .delete()
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('branch_id', branchId)
    .eq('day_of_week', dayOfWeek);
  
  const { data, error } = await supabase.from('opening_hours').insert({
    restaurant_id: RESTAURANT_ID,
    branch_id: branchId,
    day_of_week: dayOfWeek,
    open_time: isClosed ? null : openTime,
    close_time: isClosed ? null : closeTime,
    is_closed: isClosed,
  }).select().single();
  if (error) console.error('saveOpeningHours:', error);
  return { data, error };
}

// ---- RESERVATIONS ---------------------------------------------------------
export async function saveReservation(res) {
  const { data, error } = await supabase.from('reservations').insert({
    restaurant_id: RESTAURANT_ID,
    branch_id: res.branchId,
    customer_name: res.name,
    customer_email: res.email,
    customer_phone: res.phone || null,
    party_size: parseInt(res.guests) || 2,
    reservation_date: res.date,
    reservation_time: res.time,
    notes: res.notes || null,
    status: res.status || 'confirmed',
    table_id: res.tableId || null,
  }).select().single();
  if (error) console.error('saveReservation:', error);
  return { data, error };
}

export async function fetchReservations(branchId, dateFrom, dateTo) {
  let q = supabase.from('reservations').select('*').eq('restaurant_id', RESTAURANT_ID);
  if (branchId) q = q.eq('branch_id', branchId);
  if (dateFrom) q = q.gte('reservation_date', dateFrom);
  if (dateTo) q = q.lte('reservation_date', dateTo);
  const { data, error } = await q.order('reservation_date').order('reservation_time');
  if (error) console.error('fetchReservations:', error);
  return data || [];
}

export async function updateReservationStatus(id, status) {
  const { data, error } = await supabase.from('reservations')
    .update({ status })
    .eq('id', id)
    .select().single();
  return { data, error };
}

// ---- TABLES ---------------------------------------------------------------
export async function fetchTables(branchId) {
  let q = supabase.from('restaurant_tables').select('*').eq('restaurant_id', RESTAURANT_ID);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q.order('table_number');
  if (error) console.error('fetchTables:', error);
  return data || [];
}

export async function updateTableStatus(id, status, extra) {
  const payload = { status, ...(extra || {}) };
  const { data, error } = await supabase.from('restaurant_tables')
    .update(payload)
    .eq('id', id)
    .select().single();
  if (error) console.error('updateTableStatus:', error);
  return { data, error };
}

export async function saveTable(table) {
  if (table.dbId) {
    const { data, error } = await supabase.from('restaurant_tables')
      .update({
        seats: table.seats,
        x_pos: table.x,
        y_pos: table.y,
        status: table.status,
        table_number: table.id,
      })
      .eq('id', table.dbId)
      .select().single();
    return { data, error };
  } else {
    const { data, error } = await supabase.from('restaurant_tables').insert({
      restaurant_id: RESTAURANT_ID,
      branch_id: table.branchId || 'b1',
      table_number: table.id,
      seats: table.seats,
      x_pos: table.x,
      y_pos: table.y,
      status: table.status || 'free',
    }).select().single();
    return { data, error };
  }
}

export async function deleteTable(dbId) {
  const { error } = await supabase.from('restaurant_tables')
    .delete()
    .eq('id', dbId);
  if (error) console.error('deleteTable:', error);
  return { error };
}

// ---- CUSTOMER AUTH ----------------------------------------------------------
// Simple email+password auth using customers table
// Note: For production, use Supabase Auth (supabase.auth.signUp) for real security

export async function registerCustomer(name, email, password, phone) {
  // Check if email already exists
  const { data: existing } = await supabase.from('customers')
    .select('id')
    .eq('email', email)
    .eq('restaurant_id', RESTAURANT_ID)
    .maybeSingle();
  if (existing) {
    return { error: { message: 'Email already registered' } };
  }
  // Insert new customer with password (stored as-is for demo; use Supabase Auth in production)
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: RESTAURANT_ID,
    name: name,
    email: email,
    phone: phone || null,
    password_hash: password, // In production, hash this or use Supabase Auth
    address: {},
  }).select().single();
  if (error) console.error('registerCustomer:', error);
  return { data, error };
}

export async function loginCustomer(email, password) {
  const { data, error } = await supabase.from('customers')
    .select('*')
    .eq('email', email)
    .eq('restaurant_id', RESTAURANT_ID)
    .maybeSingle();
  if (error) {
    console.error('loginCustomer:', error);
    return { error };
  }
  if (!data) return { error: { message: 'Email not found' } };
  if (data.password_hash !== password) return { error: { message: 'Incorrect password' } };
  return { data };
}

// ---- DELIVERY SETTINGS ------------------------------------------------------
export async function fetchDeliverySettings(branchId) {
  let q = supabase.from('delivery_settings').select('*').eq('restaurant_id', RESTAURANT_ID);
  if (branchId) q = q.eq('branch_id', branchId).maybeSingle();
  const { data, error } = await q;
  if (error) console.error('fetchDeliverySettings:', error);
  return data;
}

export async function fetchAllDeliverySettings() {
  const { data, error } = await supabase.from('delivery_settings')
    .select('*').eq('restaurant_id', RESTAURANT_ID);
  if (error) console.error('fetchAllDeliverySettings:', error);
  return data || [];
}

export async function saveDeliverySettings(branchId, settings) {
  // Check if exists
  const { data: existing } = await supabase.from('delivery_settings')
    .select('id').eq('restaurant_id', RESTAURANT_ID).eq('branch_id', branchId).maybeSingle();
  
  const payload = {
    restaurant_id: RESTAURANT_ID,
    branch_id: branchId,
    method: settings.method || 'radius',
    enabled: settings.enabled !== false,
    min_order: settings.minOrder || 0,
    free_over: settings.freeOver || 0,
    flat_fee: settings.flatFee || 0,
    max_radius: settings.maxRadius || 3,
    zones: settings.zones || [],
    postcodes: settings.postcodes || [],
    cod_enabled: settings.codEnabled !== false,
    cod_min_order: settings.codMinOrder || 15,
    cod_max_miles: settings.codMaxMiles || 3,
    updated_at: new Date().toISOString(),
  };
  
  if (existing) {
    const { data, error } = await supabase.from('delivery_settings')
      .update(payload).eq('id', existing.id).select().single();
    if (error) console.error('updateDeliverySettings:', error);
    return { data, error };
  } else {
    const { data, error } = await supabase.from('delivery_settings')
      .insert(payload).select().single();
    if (error) console.error('insertDeliverySettings:', error);
    return { data, error };
  }
}

// ---- DISCOUNT CODES ---------------------------------------------------------
export async function fetchDiscountCodes() {
  const { data, error } = await supabase.from('discount_codes')
    .select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false });
  if (error) console.error('fetchDiscountCodes:', error);
  return data || [];
}

export async function saveDiscountCode(code) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    code: code.code.toUpperCase().trim(),
    type: code.type || 'percent',
    value: parseFloat(code.value) || 0,
    description: code.description || null,
    min_order: parseFloat(code.minOrder) || 0,
    max_uses: parseInt(code.maxUses) || 1000,
    uses: code.uses || 0,
    expires_at: code.expiresAt || null,
    active: code.active !== false,
    first_order_only: code.firstOrderOnly || false,
    branch_ids: code.branchIds || [],
  };
  if (code.dbId) {
    const { data, error } = await supabase.from('discount_codes')
      .update(payload).eq('id', code.dbId).select().single();
    return { data, error };
  } else {
    const { data, error } = await supabase.from('discount_codes')
      .insert(payload).select().single();
    return { data, error };
  }
}

export async function deleteDiscountCode(dbId) {
  const { error } = await supabase.from('discount_codes').delete().eq('id', dbId);
  return { error };
}

export async function incrementDiscountUse(code) {
  const { data } = await supabase.from('discount_codes')
    .select('uses').eq('restaurant_id', RESTAURANT_ID).eq('code', code.toUpperCase()).maybeSingle();
  if (data) {
    await supabase.from('discount_codes')
      .update({ uses: (data.uses || 0) + 1 })
      .eq('restaurant_id', RESTAURANT_ID).eq('code', code.toUpperCase());
  }
}

// ---- AUTO DISCOUNTS ---------------------------------------------------------
export async function fetchAutoDiscounts() {
  const { data, error } = await supabase.from('auto_discounts')
    .select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false });
  if (error) console.error('fetchAutoDiscounts:', error);
  return data || [];
}

export async function saveAutoDiscount(ad) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: ad.name,
    description: ad.description || null,
    rule_type: ad.ruleType || 'min_order',
    min_order: parseFloat(ad.minOrder) || 0,
    discount_type: ad.discountType || 'percent',
    discount_value: parseFloat(ad.discountValue) || 10,
    active: ad.active !== false,
    first_order_only: ad.firstOrderOnly || false,
    branch_ids: ad.branchIds || [],
  };
  if (ad.dbId) {
    const { data, error } = await supabase.from('auto_discounts')
      .update(payload).eq('id', ad.dbId).select().single();
    return { data, error };
  } else {
    const { data, error } = await supabase.from('auto_discounts')
      .insert(payload).select().single();
    return { data, error };
  }
}

export async function deleteAutoDiscount(dbId) {
  const { error } = await supabase.from('auto_discounts').delete().eq('id', dbId);
  return { error };
}

// ---- KITCHEN STATIONS -------------------------------------------------------
export async function fetchStations() {
  const { data, error } = await supabase.from('kitchen_stations')
    .select('*').eq('restaurant_id', RESTAURANT_ID)
    .order('sort_order', { ascending: true });
  if (error) console.error('fetchStations:', error);
  return data || [];
}

export async function saveStation(s) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: s.name,
    icon: s.icon || 'cook',
    color: s.color || '#bf4626',
    sort_order: parseInt(s.sortOrder) || 0,
    active: s.active !== false,
    printer_method: s.printerMethod || 'none',
    printer_format: s.printerFormat || 'thermal',
    print_content: s.printContent || 'station_only',
    auto_print: s.autoPrint || false,
    printnode_id: s.printnodeId || null,
    copies: parseInt(s.copies) || 1,
  };
  if (s.dbId) {
    const { data, error } = await supabase.from('kitchen_stations')
      .update(payload).eq('id', s.dbId).select().single();
    return { data, error };
  } else {
    const { data, error } = await supabase.from('kitchen_stations')
      .insert(payload).select().single();
    return { data, error };
  }
}

export async function deleteStation(dbId) {
  const { error } = await supabase.from('kitchen_stations').delete().eq('id', dbId);
  return { error };
}

export async function updateStationProgress(orderId, stationName, isReady) {
  // Get current order
  const { data: order } = await supabase.from('orders')
    .select('station_progress')
    .eq('order_number', orderId).maybeSingle();
  const progress = (order && order.station_progress) || {};
  progress[stationName] = isReady;
  const { error } = await supabase.from('orders')
    .update({ station_progress: progress })
    .eq('order_number', orderId);
  return { error, progress };
}

// ---- DELIVERY CODES + CASH RECONCILIATION -----------------------------------
export async function verifyDeliveryCode(orderId, code, driverName) {
  const { data: order } = await supabase.from('orders')
    .select('delivery_code,total,pay_method,paid')
    .eq('order_number', orderId).maybeSingle();
  if (!order) return { ok: false, reason: 'Order not found' };
  if (!order.delivery_code) return { ok: false, reason: 'No code set on this order' };
  if (String(order.delivery_code) !== String(code)) return { ok: false, reason: 'Code does not match' };
  // Mark as delivered
  await supabase.from('orders').update({
    status: 'delivered',
    delivered_at: new Date().toISOString(),
    delivered_by: driverName,
  }).eq('order_number', orderId);
  return { ok: true, isCOD: order.pay_method === 'cod' && !order.paid, total: parseFloat(order.total) };
}

export async function recordCashCollected(orderId, amount, driverName) {
  const { error } = await supabase.from('orders').update({
    paid: true,
    pay_method: 'cash',
    cash_collected: amount,
    delivered_by: driverName,
  }).eq('order_number', orderId);
  return { error };
}

export async function fetchCashHandovers(branchId) {
  let q = supabase.from('cash_handovers').select('*').eq('restaurant_id', RESTAURANT_ID);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) console.error('fetchCashHandovers:', error);
  return data || [];
}

export async function recordCashHandover(handover) {
  const { data, error } = await supabase.from('cash_handovers').insert({
    restaurant_id: RESTAURANT_ID,
    branch_id: handover.branchId || null,
    driver_name: handover.driverName,
    manager_name: handover.managerName,
    amount: parseFloat(handover.amount),
    order_ids: handover.orderIds || [],
    expected_amount: parseFloat(handover.expectedAmount || handover.amount),
    notes: handover.notes || null,
  }).select().single();
  // Mark associated orders with handover id
  if (data && handover.orderIds && handover.orderIds.length) {
    await supabase.from('orders').update({ cash_handover_id: data.id })
      .in('order_number', handover.orderIds);
  }
  return { data, error };
}
