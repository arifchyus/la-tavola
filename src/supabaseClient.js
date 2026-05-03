// src/supabaseClient.js
// Initializes the Supabase connection for La Tavola

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rxvvlsvayacjkqhgpoux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m4GflHDxK5JN_xfxa5Aa0w_pVimYuFd';

// Create a single Supabase client for the entire app
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Your restaurant's unique ID (matches what we inserted in SQL)
// MULTI-TENANT: Restaurant ID is dynamic - changes based on logged-in restaurant
// Default is your restaurant (auto-detected by slug 'la-tavola')
// In SaaS-2 we'll add proper login to switch restaurants
let _currentRestaurantId = null; // will be set after fetchRestaurantBySlug

// On module load, immediately try to read saved restaurant from localStorage
// This ensures _currentRestaurantId is set BEFORE any queries run
// EXCEPT if URL has ?r= param - then URL takes priority (customer browsing)
try {
  if (typeof localStorage !== 'undefined' && typeof window !== 'undefined') {
    // Check if URL is requesting a specific restaurant (customer link)
    const urlHasRestaurant = window.location.search.includes('r=') || window.location.search.includes('restaurant=');
    if (!urlHasRestaurant) {
      // Only use localStorage if not visiting via URL
      const raw = localStorage.getItem('latavola_saas_restaurant');
      if (raw) {
        const r = JSON.parse(raw);
        if (r && r.id) _currentRestaurantId = r.id;
      }
    }
  }
} catch (e) {
  // ignore - localStorage might not be available
}

export const setCurrentRestaurantId = (id) => {
  if (id) {
    _currentRestaurantId = id;
    RESTAURANT_ID = id; // also update legacy export
  }
};

export const getCurrentRestaurantId = () => _currentRestaurantId;

// Auto-detect "your" restaurant on app load
export async function autoDetectMyRestaurant() {
  try {
    const { data } = await supabase
      .from('restaurants')
      .select('id, name, slug, plan')
      .eq('slug', 'la-tavola')
      .single();
    if (data) {
      _currentRestaurantId = data.id;
      return data;
    }
  } catch (e) {
    console.log('Auto-detect failed:', e);
  }
  return null;
}

// RESTAURANT_ID: A let variable that updates when restaurant switches
// All queries should use _rid() to get current value dynamically
export let RESTAURANT_ID = _currentRestaurantId || '00000000-0000-0000-0000-000000000001';

// Helper that returns current restaurant ID (always fresh)
function _rid() {
  return _currentRestaurantId || RESTAURANT_ID;
}

// New: function that returns the current tenant's ID (preferred for new code)
export const TENANT_ID = () => _currentRestaurantId;

// Helper: generate a simple order number like ORD-12345
export const genOrderNumber = () => 'ORD-' + Math.floor(10000 + Math.random() * 90000);

// ---- ORDER HELPERS ----------------------------------------------------------

export async function saveOrderToDb(order) {
  const { data, error } = await supabase.from('orders').insert({
    order_number: order.id,
    restaurant_id: _rid(),
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
    service_charge: parseFloat(order.serviceCharge) || 0,
  }).select().single();
  if (error) console.error('saveOrderToDb error:', error);
  return { data, error };
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', _rid())
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
    .eq('restaurant_id', _rid())
    .eq('phone', clean)
    .maybeSingle();
  if (error) console.error('findCustomerByPhone error:', error);
  return data;
}

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('restaurant_id', _rid())
    .order('created_at', { ascending: false });
  if (error) console.error('fetchCustomers error:', error);
  return data || [];
}

export async function saveCustomer(customer) {
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid());
  if (error) console.error('fetchMenu error:', error);
  return data || [];
}

export async function saveMenuItem(item) {
  // Save menu item with category name directly
  const payload = {
    restaurant_id: _rid(),
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
    price_dinein: item.priceDineIn || null,
    price_takeaway: item.priceTakeaway || null,
    price_delivery: item.priceDelivery || null,
    avail_dinein: item.availDineIn !== false,
    avail_takeaway: item.availTakeaway !== false,
    avail_delivery: item.availDelivery !== false,
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
    .eq('restaurant_id', _rid())
    .order('display_order', { ascending: true });
  if (error) console.error('fetchCategories error:', error);
  return data || [];
}

export async function saveCategory(cat) {
  const payload = {
    restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid());
  if (error) console.error('fetchSetMeals error:', error);
  return data || [];
}

export async function saveSetMeal(meal) {
  const payload = {
    restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid())
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) console.error('fetchReviews error:', error);
  return data || [];
}

export async function submitReview(review) {
  const { error } = await supabase.from('reviews').insert({
    restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid())
    .eq('branch_id', branchId)
    .order('day_of_week');
  if (error) console.error('fetchOpeningHours:', error);
  return data || [];
}

export async function saveOpeningHours(branchId, dayOfWeek, openTime, closeTime, isClosed) {
  // Upsert: delete old then insert new (simpler than upsert for our case)
  await supabase.from('opening_hours')
    .delete()
    .eq('restaurant_id', _rid())
    .eq('branch_id', branchId)
    .eq('day_of_week', dayOfWeek);
  
  const { data, error } = await supabase.from('opening_hours').insert({
    restaurant_id: _rid(),
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
    restaurant_id: _rid(),
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
  let q = supabase.from('reservations').select('*').eq('restaurant_id', _rid());
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
  let q = supabase.from('restaurant_tables').select('*').eq('restaurant_id', _rid());
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
      restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid())
    .maybeSingle();
  if (existing) {
    return { error: { message: 'Email already registered' } };
  }
  // Insert new customer with password (stored as-is for demo; use Supabase Auth in production)
  const { data, error } = await supabase.from('customers').insert({
    restaurant_id: _rid(),
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
    .eq('restaurant_id', _rid())
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
  let q = supabase.from('delivery_settings').select('*').eq('restaurant_id', _rid());
  if (branchId) q = q.eq('branch_id', branchId).maybeSingle();
  const { data, error } = await q;
  if (error) console.error('fetchDeliverySettings:', error);
  return data;
}

export async function fetchAllDeliverySettings() {
  const { data, error } = await supabase.from('delivery_settings')
    .select('*').eq('restaurant_id', _rid());
  if (error) console.error('fetchAllDeliverySettings:', error);
  return data || [];
}

export async function saveDeliverySettings(branchId, settings) {
  // Check if exists
  const { data: existing } = await supabase.from('delivery_settings')
    .select('id').eq('restaurant_id', _rid()).eq('branch_id', branchId).maybeSingle();
  
  const payload = {
    restaurant_id: _rid(),
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
    service_charge_enabled: settings.serviceChargeEnabled || false,
    service_charge_percent: parseFloat(settings.serviceChargePercent) || 12.5,
    service_charge_mandatory: settings.serviceChargeMandatory || false,
    service_charge_group_size: parseInt(settings.serviceChargeGroupSize) || 6,
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
    .select('*').eq('restaurant_id', _rid()).order('created_at', { ascending: false });
  if (error) console.error('fetchDiscountCodes:', error);
  return data || [];
}

export async function saveDiscountCode(code) {
  const payload = {
    restaurant_id: _rid(),
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
    .select('uses').eq('restaurant_id', _rid()).eq('code', code.toUpperCase()).maybeSingle();
  if (data) {
    await supabase.from('discount_codes')
      .update({ uses: (data.uses || 0) + 1 })
      .eq('restaurant_id', _rid()).eq('code', code.toUpperCase());
  }
}

// ---- AUTO DISCOUNTS ---------------------------------------------------------
export async function fetchAutoDiscounts() {
  const { data, error } = await supabase.from('auto_discounts')
    .select('*').eq('restaurant_id', _rid()).order('created_at', { ascending: false });
  if (error) console.error('fetchAutoDiscounts:', error);
  return data || [];
}

export async function saveAutoDiscount(ad) {
  const payload = {
    restaurant_id: _rid(),
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
    .select('*').eq('restaurant_id', _rid())
    .order('sort_order', { ascending: true });
  if (error) console.error('fetchStations:', error);
  return data || [];
}

export async function saveStation(s) {
  const payload = {
    restaurant_id: _rid(),
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
  let q = supabase.from('cash_handovers').select('*').eq('restaurant_id', _rid());
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) console.error('fetchCashHandovers:', error);
  return data || [];
}

export async function recordCashHandover(handover) {
  const { data, error } = await supabase.from('cash_handovers').insert({
    restaurant_id: _rid(),
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

// ---- LOYALTY POINTS ---------------------------------------------------------
export async function fetchCustomerLoyalty(customerId) {
  const { data, error } = await supabase.from('customers')
    .select('loyalty_points,total_spent,loyalty_tier')
    .eq('id', customerId).maybeSingle();
  if (error) console.error('fetchCustomerLoyalty:', error);
  return data || { loyalty_points: 0, total_spent: 0, loyalty_tier: 'bronze' };
}

export async function awardLoyaltyPoints(customerId, points, orderId, description) {
  // Get current points
  const { data: cust } = await supabase.from('customers')
    .select('loyalty_points,total_spent').eq('id', customerId).maybeSingle();
  if (!cust) return { error: 'Customer not found' };
  const newPoints = (cust.loyalty_points || 0) + points;
  // Determine tier
  let tier = 'bronze';
  if (newPoints >= 2000) tier = 'gold';
  else if (newPoints >= 500) tier = 'silver';
  // Update customer
  await supabase.from('customers').update({
    loyalty_points: newPoints,
    loyalty_tier: tier,
  }).eq('id', customerId);
  // Log transaction
  await supabase.from('loyalty_transactions').insert({
    restaurant_id: _rid(),
    customer_id: customerId,
    type: 'earn',
    points: points,
    order_id: orderId,
    description: description || 'Order rewards',
  });
  return { points: newPoints, tier };
}

export async function redeemLoyaltyPoints(customerId, points, orderId, description) {
  const { data: cust } = await supabase.from('customers')
    .select('loyalty_points').eq('id', customerId).maybeSingle();
  if (!cust) return { error: 'Customer not found' };
  if ((cust.loyalty_points || 0) < points) return { error: 'Not enough points' };
  const newPoints = cust.loyalty_points - points;
  await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', customerId);
  await supabase.from('loyalty_transactions').insert({
    restaurant_id: _rid(),
    customer_id: customerId,
    type: 'redeem',
    points: -points,
    order_id: orderId,
    description: description || 'Discount redeemed',
  });
  return { points: newPoints };
}

export async function fetchLoyaltyHistory(customerId) {
  const { data, error } = await supabase.from('loyalty_transactions')
    .select('*').eq('customer_id', customerId)
    .order('created_at', { ascending: false }).limit(20);
  if (error) console.error('fetchLoyaltyHistory:', error);
  return data || [];
}

// ---- DIETARY PREFERENCES ----------------------------------------------------
export async function fetchDietaryPrefs(customerId) {
  const { data } = await supabase.from('customers')
    .select('dietary_prefs').eq('id', customerId).maybeSingle();
  return data?.dietary_prefs || [];
}

export async function saveDietaryPrefs(customerId, prefs) {
  const { error } = await supabase.from('customers').update({
    dietary_prefs: prefs || [],
  }).eq('id', customerId);
  return { error };
}

// ---- STAFF SCHEDULING -------------------------------------------------------
export async function fetchSchedules(branchId, fromDate, toDate) {
  let q = supabase.from('staff_schedules').select('*').eq('restaurant_id', _rid());
  if (branchId) q = q.eq('branch_id', branchId);
  if (fromDate) q = q.gte('shift_date', fromDate);
  if (toDate) q = q.lte('shift_date', toDate);
  const { data, error } = await q.order('shift_date').order('shift_start');
  if (error) console.error('fetchSchedules:', error);
  return data || [];
}

export async function saveSchedule(schedule) {
  const payload = {
    restaurant_id: _rid(),
    branch_id: schedule.branchId || null,
    staff_id: schedule.staffId,
    staff_name: schedule.staffName,
    staff_role: schedule.staffRole || 'staff',
    shift_date: schedule.shiftDate,
    shift_start: schedule.shiftStart,
    shift_end: schedule.shiftEnd,
    notes: schedule.notes || null,
  };
  if (schedule.id) {
    const { error } = await supabase.from('staff_schedules').update(payload).eq('id', schedule.id);
    return { error };
  }
  const { data, error } = await supabase.from('staff_schedules').insert(payload).select().single();
  return { data, error };
}

export async function deleteSchedule(id) {
  const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
  return { error };
}

// ---- STAFF CLOCK IN/OUT -----------------------------------------------------
export async function clockIn(staffId, staffName, branchId) {
  // Check if already clocked in
  const { data: open } = await supabase.from('staff_clock_records')
    .select('*').eq('staff_id', staffId).is('clock_out', null).maybeSingle();
  if (open) return { error: 'Already clocked in', record: open };
  const { data, error } = await supabase.from('staff_clock_records').insert({
    restaurant_id: _rid(),
    branch_id: branchId || null,
    staff_id: staffId,
    staff_name: staffName,
  }).select().single();
  return { data, error };
}

export async function clockOut(staffId) {
  const { data: open } = await supabase.from('staff_clock_records')
    .select('*').eq('staff_id', staffId).is('clock_out', null)
    .order('clock_in', { ascending: false }).limit(1).maybeSingle();
  if (!open) return { error: 'Not clocked in' };
  const clockOutTime = new Date();
  const minutes = Math.round((clockOutTime - new Date(open.clock_in)) / 60000);
  const { error } = await supabase.from('staff_clock_records').update({
    clock_out: clockOutTime.toISOString(),
    total_minutes: minutes,
  }).eq('id', open.id);
  return { error, minutes };
}

export async function fetchClockRecords(staffId, fromDate) {
  let q = supabase.from('staff_clock_records').select('*').eq('restaurant_id', _rid());
  if (staffId) q = q.eq('staff_id', staffId);
  if (fromDate) q = q.gte('clock_in', fromDate);
  const { data, error } = await q.order('clock_in', { ascending: false }).limit(50);
  if (error) console.error('fetchClockRecords:', error);
  return data || [];
}

export async function fetchCurrentlyClockedIn(branchId) {
  let q = supabase.from('staff_clock_records').select('*').is('clock_out', null);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data } = await q;
  return data || [];
}

// ===========================================================
// ADVANCED OPENING HOURS
// ===========================================================

export async function fetchBranchHours(branchId) {
  let q = supabase.from('branch_hours').select('*').order('day_of_week');
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q;
  if (error) console.error('fetchBranchHours:', error);
  return data || [];
}

export async function saveBranchHours(branchId, dayOfWeek, serviceType, serviceWindow, hours) {
  // hours = { is_closed, open_time, close_time, last_order_time }
  const { data, error } = await supabase
    .from('branch_hours')
    .upsert({
      branch_id: branchId,
      day_of_week: dayOfWeek,
      service_type: serviceType || 'all',
      service_window: serviceWindow || 1,
      is_closed: hours.is_closed || false,
      open_time: hours.open_time || null,
      close_time: hours.close_time || null,
      last_order_time: hours.last_order_time || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'branch_id,day_of_week,service_type,service_window' })
    .select();
  if (error) console.error('saveBranchHours:', error);
  return { data: data?.[0], error };
}

export async function deleteBranchHours(id) {
  const { error } = await supabase.from('branch_hours').delete().eq('id', id);
  if (error) console.error('deleteBranchHours:', error);
}

export async function fetchBranchHolidays(branchId) {
  let q = supabase.from('branch_holidays').select('*').order('holiday_date');
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q;
  if (error) console.error('fetchBranchHolidays:', error);
  return data || [];
}

export async function saveBranchHoliday(holiday) {
  const { data, error } = await supabase
    .from('branch_holidays')
    .upsert(holiday, { onConflict: 'branch_id,holiday_date' })
    .select();
  if (error) console.error('saveBranchHoliday:', error);
  return { data: data?.[0], error };
}

export async function deleteBranchHoliday(id) {
  const { error } = await supabase.from('branch_holidays').delete().eq('id', id);
  if (error) console.error('deleteBranchHoliday:', error);
}

export async function fetchBranchHoursConfig(branchId) {
  const { data, error } = await supabase
    .from('branch_hours_config')
    .select('*')
    .eq('branch_id', branchId)
    .maybeSingle();
  if (error) console.error('fetchBranchHoursConfig:', error);
  return data;
}

export async function saveBranchHoursConfig(config) {
  const { data, error } = await supabase
    .from('branch_hours_config')
    .upsert({ ...config, updated_at: new Date().toISOString() }, { onConflict: 'branch_id' })
    .select();
  if (error) console.error('saveBranchHoursConfig:', error);
  return { data: data?.[0], error };
}

// ===========================================================
// CASH MANAGEMENT, SHIFTS, VOIDS
// ===========================================================

export async function recordPayment(payment) {
  // payment = { order_id, branch_id, payment_method, amount, cash_given, change_returned, tip_amount, taken_by, shift_id }
  const { data, error } = await supabase.from('order_payments').insert(payment).select();
  if (error) console.error('recordPayment:', error);
  return { data: data?.[0], error };
}

export async function fetchOrderPayments(orderId) {
  const { data } = await supabase.from('order_payments').select('*').eq('order_id', orderId);
  return data || [];
}

// SHIFTS
export async function openShift(branchId, staffName, openingFloat) {
  const { data, error } = await supabase
    .from('staff_shifts')
    .insert({ branch_id: branchId, staff_name: staffName, opening_float: openingFloat || 0, status: 'open' })
    .select();
  if (error) console.error('openShift:', error);
  return { data: data?.[0], error };
}

export async function closeShift(shiftId, actualCash, notes) {
  // Fetch shift to compute variance
  const { data: shift } = await supabase.from('staff_shifts').select('*').eq('id', shiftId).single();
  if (!shift) return { error: 'Shift not found' };
  const expectedCash = parseFloat(shift.opening_float || 0) + parseFloat(shift.cash_sales || 0);
  const variance = parseFloat(actualCash) - expectedCash;
  const { data, error } = await supabase
    .from('staff_shifts')
    .update({
      closed_at: new Date().toISOString(),
      actual_cash: actualCash,
      expected_cash: expectedCash,
      variance,
      notes,
      status: 'closed',
    })
    .eq('id', shiftId)
    .select();
  if (error) console.error('closeShift:', error);
  return { data: data?.[0], variance, error };
}

export async function fetchOpenShift(branchId, staffName) {
  const { data } = await supabase
    .from('staff_shifts')
    .select('*')
    .eq('branch_id', branchId)
    .eq('staff_name', staffName)
    .eq('status', 'open')
    .maybeSingle();
  return data;
}

export async function fetchShifts(branchId) {
  let q = supabase.from('staff_shifts').select('*').order('opened_at', { ascending: false }).limit(50);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data } = await q;
  return data || [];
}

export async function updateShiftSales(shiftId, cashAmount, cardAmount, tipAmount) {
  // Increment shift totals
  const { data: shift } = await supabase.from('staff_shifts').select('cash_sales, card_sales, tips_collected').eq('id', shiftId).single();
  if (!shift) return;
  await supabase
    .from('staff_shifts')
    .update({
      cash_sales: parseFloat(shift.cash_sales || 0) + (cashAmount || 0),
      card_sales: parseFloat(shift.card_sales || 0) + (cardAmount || 0),
      tips_collected: parseFloat(shift.tips_collected || 0) + (tipAmount || 0),
    })
    .eq('id', shiftId);
}

// VOIDS & REFUNDS
export async function recordVoid(voidData) {
  // voidData = { order_id, branch_id, void_type, amount, reason, approved_by, staff_member }
  const { data, error } = await supabase.from('order_voids').insert(voidData).select();
  if (error) console.error('recordVoid:', error);
  return { data: data?.[0], error };
}

export async function fetchVoids(branchId) {
  let q = supabase.from('order_voids').select('*').order('created_at', { ascending: false }).limit(100);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data } = await q;
  return data || [];
}

// MANAGER PINS
export async function verifyManagerPin(pin, branchId) {
  let q = supabase.from('manager_pins').select('*').eq('pin_hash', pin).eq('active', true);
  const { data } = await q;
  if (!data || !data.length) return null;
  // Match: prefer exact branch match, fallback to global (null branch_id)
  const branchMatch = data.find(p => p.branch_id === branchId);
  return branchMatch || data.find(p => !p.branch_id) || null;
}

export async function fetchManagerPins(branchId) {
  let q = supabase.from('manager_pins').select('*').eq('active', true);
  if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
  const { data } = await q;
  return data || [];
}

export async function saveManagerPin(pinData) {
  const { data, error } = await supabase.from('manager_pins').insert(pinData).select();
  if (error) console.error('saveManagerPin:', error);
  return { data: data?.[0], error };
}

// DRAWER EVENTS
export async function recordDrawerEvent(event) {
  const { data, error } = await supabase.from('drawer_events').insert(event).select();
  if (error) console.error('recordDrawerEvent:', error);
  return { data: data?.[0], error };
}

// ===========================================================
// EXPENSE TRACKING
// ===========================================================

// Categories
export async function fetchExpenseCategories(branchId) {
  let q = supabase.from('expense_categories').select('*').eq('active', true).order('display_order');
  // Get global (branch_id IS NULL) and branch-specific
  const { data, error } = await q;
  if (error) console.error('fetchExpenseCategories:', error);
  return data || [];
}

export async function saveExpenseCategory(category) {
  const payload = {
    branch_id: category.branchId || null,
    name: category.name,
    icon: category.icon || null,
    color: category.color || '#bf4626',
    description: category.description || null,
    active: category.active !== false,
    display_order: category.displayOrder || 0,
  };
  if (category.id) {
    const { data, error } = await supabase.from('expense_categories')
      .update(payload).eq('id', category.id).select().single();
    return { data, error };
  }
  const { data, error } = await supabase.from('expense_categories')
    .insert(payload).select().single();
  return { data, error };
}

export async function deleteExpenseCategory(id) {
  const { error } = await supabase.from('expense_categories')
    .update({ active: false }).eq('id', id);
  return { error };
}

// Expenses
export async function fetchExpenses(branchId, fromDate, toDate) {
  let q = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  if (branchId) q = q.eq('branch_id', branchId);
  if (fromDate) q = q.gte('expense_date', fromDate);
  if (toDate) q = q.lte('expense_date', toDate);
  const { data, error } = await q;
  if (error) console.error('fetchExpenses:', error);
  return data || [];
}

export async function saveExpense(expense) {
  const payload = {
    branch_id: expense.branchId,
    category_id: expense.categoryId || null,
    category_name: expense.categoryName,
    amount: parseFloat(expense.amount),
    description: expense.description,
    expense_date: expense.expenseDate || new Date().toISOString().split('T')[0],
    recorded_by: expense.recordedBy,
    recorded_by_role: expense.recordedByRole || 'staff',
    receipt_photo_url: expense.receiptPhotoUrl || null,
    is_recurring: expense.isRecurring || false,
    recurring_id: expense.recurringId || null,
    notes: expense.notes || null,
    updated_at: new Date().toISOString(),
  };
  if (expense.id) {
    const { data, error } = await supabase.from('expenses')
      .update(payload).eq('id', expense.id).select().single();
    return { data, error };
  }
  const { data, error } = await supabase.from('expenses')
    .insert(payload).select().single();
  return { data, error };
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  return { error };
}

// Recurring expenses
export async function fetchRecurringExpenses(branchId) {
  let q = supabase.from('recurring_expenses').select('*').order('created_at');
  if (branchId) q = q.eq('branch_id', branchId);
  const { data } = await q;
  return data || [];
}

export async function saveRecurringExpense(rec) {
  const payload = {
    branch_id: rec.branchId,
    category_id: rec.categoryId || null,
    category_name: rec.categoryName,
    amount: parseFloat(rec.amount),
    description: rec.description,
    frequency: rec.frequency || 'monthly',
    day_of_month: rec.dayOfMonth || 1,
    start_date: rec.startDate,
    end_date: rec.endDate || null,
    active: rec.active !== false,
    notes: rec.notes || null,
  };
  if (rec.id) {
    const { data, error } = await supabase.from('recurring_expenses')
      .update(payload).eq('id', rec.id).select().single();
    return { data, error };
  }
  const { data, error } = await supabase.from('recurring_expenses')
    .insert(payload).select().single();
  return { data, error };
}

export async function deleteRecurringExpense(id) {
  const { error } = await supabase.from('recurring_expenses')
    .update({ active: false }).eq('id', id);
  return { error };
}

// Update last_generated_date on a recurring template
export async function updateRecurringLastGenerated(id, dateStr) {
  const { data, error } = await supabase.from('recurring_expenses')
    .update({ last_generated_date: dateStr }).eq('id', id).select().single();
  return { data, error };
}

// ===========================================================
// SAAS MULTI-TENANCY - Restaurant management
// ===========================================================

// Get a restaurant by ID
export async function fetchRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single();
  if (error) console.error('fetchRestaurant:', error);
  return data;
}

// Get a restaurant by subdomain (e.g., "marios" -> Mario's Pizza)
export async function fetchRestaurantBySubdomain(subdomain) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('subdomain', subdomain)
    .single();
  if (error) console.error('fetchRestaurantBySubdomain:', error);
  return data;
}

// Get all restaurants (admin view - you'll use this later)
export async function fetchAllRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('fetchAllRestaurants:', error);
  return data || [];
}

// Update a restaurant
export async function updateRestaurant(id, updates) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Create new restaurant (used during signup - Session SaaS-2)
export async function createRestaurant(restaurant) {
  const payload = {
    name: restaurant.name,
    subdomain: restaurant.subdomain,
    owner_email: restaurant.ownerEmail,
    owner_name: restaurant.ownerName,
    phone: restaurant.phone || null,
    cuisine_type: restaurant.cuisineType || 'other',
    plan: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    onboarding_complete: false,
  };
  const { data, error } = await supabase
    .from('restaurants')
    .insert(payload)
    .select()
    .single();
  return { data, error };
}

// Check if subdomain is available
export async function isSubdomainAvailable(subdomain) {
  const { data } = await supabase
    .from('restaurants')
    .select('id')
    .eq('subdomain', subdomain)
    .maybeSingle();
  return !data; // available if no result
}

// ===========================================================
// SAAS-2: AUTH (signup, login, email verification)
// ===========================================================

// Generate a random 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random token (for verification links and password reset)
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token + Date.now();
}

// Generate URL-safe slug from name
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

// Sign up new restaurant owner (creates restaurant + owner account)
export async function signupRestaurant({ restaurantName, ownerName, email, password, cuisineType, phone }) {
  // Step 1: Check if email already exists
  const { data: existing } = await supabase
    .from('restaurant_owners')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  
  if (existing) {
    return { error: { message: 'Email already registered' } };
  }
  
  // Step 2: Generate unique slug
  let slug = generateSlug(restaurantName);
  let slugAttempts = 0;
  while (slugAttempts < 10) {
    const { data: slugCheck } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!slugCheck) break;
    slug = generateSlug(restaurantName) + '-' + Math.floor(Math.random() * 1000);
    slugAttempts++;
  }
  
  // Step 3: Create restaurant
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .insert({
      name: restaurantName,
      slug: slug,
      subdomain: slug,
      owner_email: email.toLowerCase().trim(),
      owner_name: ownerName,
      phone: phone || null,
      plan: 'trial',
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_complete: false,
      cuisine_type: cuisineType || 'other',
      active: true,
    })
    .select()
    .single();
  
  if (restError) return { error: restError };
  
  // Step 4: Create owner account
  const { data: owner, error: ownerError } = await supabase
    .from('restaurant_owners')
    .insert({
      restaurant_id: restaurant.id,
      email: email.toLowerCase().trim(),
      password_hash: password, // TEMPORARY: plain text for demo. Hash in production.
      full_name: ownerName,
      phone: phone || null,
      email_verified: false,
      active: true,
      is_owner: true,
    })
    .select()
    .single();
  
  if (ownerError) {
    // Rollback: delete restaurant
    await supabase.from('restaurants').delete().eq('id', restaurant.id);
    return { error: ownerError };
  }
  
  // Step 4.5: AUTO-SETUP - Create starter content for new restaurant
  try {
    await setupNewRestaurant(restaurant.id, restaurant.name, cuisineType || 'other');
  } catch (e) {
    console.warn('Auto-setup failed (non-critical):', e);
  }
  
  // Step 5: Create verification token
  const verCode = generateVerificationCode();
  const verToken = generateToken();
  await supabase.from('email_verifications').insert({
    owner_id: owner.id,
    email: owner.email,
    token: verToken,
    verification_code: verCode,
  });
  
  // For demo: log verification code to console (in production, send email)
  console.log('[KEY] Verification code for', email, ':', verCode);
  
  return { 
    data: { 
      restaurant, 
      owner: { ...owner, password_hash: undefined }, 
      verificationCode: verCode 
    } 
  };
}

// Login with email + password
export async function loginRestaurant(email, password) {
  const { data: owner, error } = await supabase
    .from('restaurant_owners')
    .select('*, restaurants(*)')
    .eq('email', email.toLowerCase().trim())
    .eq('active', true)
    .maybeSingle();
  
  if (error || !owner) {
    return { error: { message: 'Invalid email or password' } };
  }
  
  if (owner.password_hash !== password) {
    return { error: { message: 'Invalid email or password' } };
  }
  
  if (!owner.email_verified) {
    return { error: { message: 'Email not verified', needsVerification: true, ownerId: owner.id, email: owner.email } };
  }
  
  // Update last login
  await supabase
    .from('restaurant_owners')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', owner.id);
  
  // Set current restaurant
  if (owner.restaurants) {
    setCurrentRestaurantId(owner.restaurant_id);
  }
  
  return {
    data: {
      owner: { ...owner, password_hash: undefined, restaurants: undefined },
      restaurant: owner.restaurants,
    }
  };
}

// Verify email with code
export async function verifyEmail(email, code) {
  const { data: verification } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('verification_code', code)
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (!verification) {
    return { error: { message: 'Invalid or expired code' } };
  }
  
  // Mark verification as used
  await supabase
    .from('email_verifications')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', verification.id);
  
  // Mark owner as verified
  await supabase
    .from('restaurant_owners')
    .update({ 
      email_verified: true, 
      email_verified_at: new Date().toISOString() 
    })
    .eq('id', verification.owner_id);
  
  return { data: { verified: true, ownerId: verification.owner_id } };
}

// Resend verification code
export async function resendVerification(email) {
  const { data: owner } = await supabase
    .from('restaurant_owners')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  
  if (!owner) return { error: { message: 'Account not found' } };
  
  const verCode = generateVerificationCode();
  const verToken = generateToken();
  await supabase.from('email_verifications').insert({
    owner_id: owner.id,
    email: owner.email,
    token: verToken,
    verification_code: verCode,
  });
  
  console.log('[KEY] New verification code for', email, ':', verCode);
  return { data: { verificationCode: verCode } };
}

// Get current logged-in owner from localStorage
export function getCurrentOwner() {
  try {
    const raw = localStorage.getItem('latavola_saas_owner');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// Save logged-in owner to localStorage
export function saveCurrentOwner(owner, restaurant) {
  try {
    localStorage.setItem('latavola_saas_owner', JSON.stringify(owner));
    localStorage.setItem('latavola_saas_restaurant', JSON.stringify(restaurant));
    if (restaurant) setCurrentRestaurantId(restaurant.id);
  } catch (e) {}
}

// Logout
export function logoutSaaS() {
  try {
    localStorage.removeItem('latavola_saas_owner');
    localStorage.removeItem('latavola_saas_restaurant');
  } catch (e) {}
}

// Get currently logged-in restaurant
export function getCurrentSaasRestaurant() {
  try {
    const raw = localStorage.getItem('latavola_saas_restaurant');
    if (raw) {
      const r = JSON.parse(raw);
      setCurrentRestaurantId(r.id);
      return r;
    }
  } catch (e) {}
  return null;
}

// Switch to a different restaurant (for testing)
export async function switchRestaurant(restaurantId) {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single();
  if (restaurant) {
    setCurrentRestaurantId(restaurant.id);
    try {
      localStorage.setItem('latavola_saas_restaurant', JSON.stringify(restaurant));
    } catch (e) {}
    return restaurant;
  }
  return null;
}

// ===========================================================
// AUTO-SETUP: Create starter content for new restaurants
// ===========================================================

async function setupNewRestaurant(restaurantId, restaurantName, cuisineType) {
  console.log('Setting up new restaurant:', restaurantName, 'cuisine:', cuisineType);
  
  // 1. Create default categories (uses display_order, not sort_order)
  const defaultCategories = [
    { name: 'Starters', icon: 'salad', display_order: 1 },
    { name: 'Mains', icon: 'bowl', display_order: 2 },
    { name: 'Drinks', icon: 'glass', display_order: 3 },
    { name: 'Desserts', icon: 'cake', display_order: 4 },
  ];
  
  for (const cat of defaultCategories) {
    try {
      await supabase.from('categories').insert({
        ...cat,
        restaurant_id: restaurantId,
      });
    } catch (e) {
      console.warn('Category insert failed:', cat.name, e);
    }
  }
  
  // 2. Create cuisine-specific sample menu items
  const cuisineMenus = {
    italian: [
      { name: 'Bruschetta', cat: 'Starters', price: 6.50, desc: 'Toasted bread with tomato, garlic, and basil' },
      { name: 'Margherita Pizza', cat: 'Mains', price: 9.99, desc: 'Tomato, mozzarella, fresh basil' },
      { name: 'Spaghetti Carbonara', cat: 'Mains', price: 12.50, desc: 'Bacon, egg, pecorino, black pepper' },
      { name: 'Tiramisu', cat: 'Desserts', price: 5.50, desc: 'Classic Italian dessert' },
      { name: 'Italian Soda', cat: 'Drinks', price: 3.00, desc: 'Sparkling water with syrup' },
    ],
    indian: [
      { name: 'Onion Bhaji', cat: 'Starters', price: 4.50, desc: 'Crispy onion fritters' },
      { name: 'Chicken Tikka Masala', cat: 'Mains', price: 11.50, desc: 'Creamy tomato curry with chicken' },
      { name: 'Lamb Biryani', cat: 'Mains', price: 13.99, desc: 'Aromatic basmati rice with tender lamb' },
      { name: 'Gulab Jamun', cat: 'Desserts', price: 4.50, desc: 'Sweet milk dumplings' },
      { name: 'Mango Lassi', cat: 'Drinks', price: 3.50, desc: 'Yogurt drink with mango' },
    ],
    chinese: [
      { name: 'Spring Rolls', cat: 'Starters', price: 5.50, desc: 'Crispy vegetable spring rolls' },
      { name: 'Sweet and Sour Chicken', cat: 'Mains', price: 10.50, desc: 'Crispy chicken with sweet and sour sauce' },
      { name: 'Beef Chow Mein', cat: 'Mains', price: 11.99, desc: 'Stir-fried noodles with beef' },
      { name: 'Banana Fritters', cat: 'Desserts', price: 5.00, desc: 'Crispy banana with honey' },
      { name: 'Jasmine Tea', cat: 'Drinks', price: 2.50, desc: 'Traditional Chinese tea' },
    ],
    british: [
      { name: 'Soup of the Day', cat: 'Starters', price: 5.50, desc: 'Homemade with crusty bread' },
      { name: 'Fish and Chips', cat: 'Mains', price: 13.50, desc: 'Beer-battered cod with chips' },
      { name: 'Sunday Roast', cat: 'Mains', price: 15.99, desc: 'Roast beef with all the trimmings' },
      { name: 'Sticky Toffee Pudding', cat: 'Desserts', price: 6.50, desc: 'With vanilla ice cream' },
      { name: 'Builders Tea', cat: 'Drinks', price: 2.00, desc: 'Strong English tea' },
    ],
    american: [
      { name: 'Mozzarella Sticks', cat: 'Starters', price: 6.50, desc: 'Crispy fried with marinara sauce' },
      { name: 'Classic Burger', cat: 'Mains', price: 9.99, desc: 'Beef patty, lettuce, tomato, onion' },
      { name: 'BBQ Bacon Burger', cat: 'Mains', price: 11.99, desc: 'BBQ sauce, bacon, cheddar' },
      { name: 'Apple Pie', cat: 'Desserts', price: 5.50, desc: 'With vanilla ice cream' },
      { name: 'Soft Drink', cat: 'Drinks', price: 2.50, desc: 'Coke, Sprite, or Fanta' },
    ],
    mexican: [
      { name: 'Nachos', cat: 'Starters', price: 6.99, desc: 'With cheese, salsa, guacamole' },
      { name: 'Beef Tacos', cat: 'Mains', price: 9.50, desc: '3 soft tacos with seasoned beef' },
      { name: 'Chicken Burrito', cat: 'Mains', price: 10.99, desc: 'Rice, beans, chicken, salsa' },
      { name: 'Churros', cat: 'Desserts', price: 5.50, desc: 'Cinnamon sugar with chocolate sauce' },
      { name: 'Horchata', cat: 'Drinks', price: 3.00, desc: 'Sweet rice and cinnamon drink' },
    ],
    japanese: [
      { name: 'Edamame', cat: 'Starters', price: 4.50, desc: 'Steamed soybeans with sea salt' },
      { name: 'Salmon Sushi (8 pcs)', cat: 'Mains', price: 12.99, desc: 'Fresh salmon nigiri and rolls' },
      { name: 'Chicken Teriyaki', cat: 'Mains', price: 11.50, desc: 'Grilled chicken with teriyaki sauce' },
      { name: 'Mochi Ice Cream', cat: 'Desserts', price: 5.00, desc: '3 pieces, assorted flavors' },
      { name: 'Green Tea', cat: 'Drinks', price: 2.50, desc: 'Traditional Japanese tea' },
    ],
    thai: [
      { name: 'Spring Rolls', cat: 'Starters', price: 5.50, desc: 'Crispy with sweet chili sauce' },
      { name: 'Pad Thai', cat: 'Mains', price: 10.99, desc: 'Stir-fried rice noodles with peanuts' },
      { name: 'Green Curry', cat: 'Mains', price: 11.99, desc: 'Spicy curry with coconut milk' },
      { name: 'Mango Sticky Rice', cat: 'Desserts', price: 5.50, desc: 'Sweet sticky rice with mango' },
      { name: 'Thai Iced Tea', cat: 'Drinks', price: 3.00, desc: 'Sweet tea with milk' },
    ],
    cafe: [
      { name: 'Avocado Toast', cat: 'Starters', price: 7.50, desc: 'Sourdough with smashed avocado' },
      { name: 'Club Sandwich', cat: 'Mains', price: 8.99, desc: 'Chicken, bacon, lettuce, tomato' },
      { name: 'Grilled Panini', cat: 'Mains', price: 7.50, desc: 'Cheese and ham toasted panini' },
      { name: 'Carrot Cake', cat: 'Desserts', price: 4.50, desc: 'Slice with cream cheese frosting' },
      { name: 'Latte', cat: 'Drinks', price: 3.50, desc: 'Espresso with steamed milk' },
    ],
    other: [
      { name: 'Side Salad', cat: 'Starters', price: 5.00, desc: 'Mixed greens with dressing' },
      { name: 'Daily Special', cat: 'Mains', price: 11.99, desc: 'Ask staff for todays special' },
      { name: 'House Pasta', cat: 'Mains', price: 9.99, desc: 'Chefs choice pasta dish' },
      { name: 'Chocolate Brownie', cat: 'Desserts', price: 5.50, desc: 'Warm with vanilla ice cream' },
      { name: 'Soft Drink', cat: 'Drinks', price: 2.50, desc: 'Coke, Sprite, or water' },
    ],
  };
  
  const menuItems = cuisineMenus[cuisineType] || cuisineMenus.other;
  
  for (const item of menuItems) {
    try {
      await supabase.from('menu_items').insert({
        name: item.name,
        category_name: item.cat,
        price: item.price,
        price_dinein: item.price,
        price_takeaway: item.price,
        price_delivery: item.price,
        description: item.desc,
        available: true,
        avail_dinein: true,
        avail_takeaway: true,
        avail_delivery: true,
        stock: 99,
        icon: 'cart',
        restaurant_id: restaurantId,
      });
    } catch (e) {
      console.warn('Menu item insert failed:', item.name, e);
    }
  }
  
  // 3. Create default tables (table is restaurant_tables)
  const branchId = 'b-' + restaurantId.substring(0, 8);
  for (let i = 1; i <= 6; i++) {
    try {
      await supabase.from('restaurant_tables').insert({
        table_number: 'T' + i,
        seats: i === 3 ? 2 : (i === 4 ? 6 : (i === 6 ? 8 : 4)),
        status: 'free',
        branch_id: branchId,
        x_pos: 100 + ((i - 1) % 3) * 100,
        y_pos: 100 + Math.floor((i - 1) / 3) * 100,
        restaurant_id: restaurantId,
      });
    } catch (e) {
      console.warn('Table insert failed:', i, e);
    }
  }
  
  // 4. Create default manager PIN (1234)
  try {
    await supabase.from('manager_pins').insert({
      pin_hash: '1234',
      label: 'Manager',
      active: true,
      restaurant_id: restaurantId,
    });
  } catch (e) {
    console.warn('Manager PIN insert failed:', e);
  }
  
  // 5. Create default expense categories
  const expCategories = [
    { name: 'Food & Beverages', icon: 'food', color: '#dc2626', display_order: 1 },
    { name: 'Utilities', icon: 'bolt', color: '#0891b2', display_order: 2 },
    { name: 'Rent', icon: 'building', color: '#7c3aed', display_order: 3 },
    { name: 'Salaries', icon: 'users', color: '#059669', display_order: 4 },
    { name: 'Equipment', icon: 'wrench', color: '#d97706', display_order: 5 },
    { name: 'Marketing', icon: 'speaker', color: '#be185d', display_order: 6 },
    { name: 'Cleaning', icon: 'broom', color: '#0d9488', display_order: 7 },
    { name: 'Other', icon: 'box', color: '#6b7280', display_order: 8 },
  ];
  
  for (const cat of expCategories) {
    try {
      await supabase.from('expense_categories').insert({
        ...cat,
        active: true,
        restaurant_id: restaurantId,
      });
    } catch (e) {
      console.warn('Expense category insert failed:', cat.name, e);
    }
  }
  
  console.log('Auto-setup complete for', restaurantName);
}

// ===========================================================
// PHASE A: URL ROUTING - Find restaurants for customer ordering
// ===========================================================

// Detect restaurant from URL (path, subdomain, or query param)
export async function detectRestaurantFromUrl() {
  if (typeof window === 'undefined') return null;
  
  try {
    // 1. Check ?r= query param first (highest priority)
    const params = new URLSearchParams(window.location.search);
    const queryRestaurant = params.get('r') || params.get('restaurant');
    if (queryRestaurant) {
      const r = await fetchRestaurantBySlug(queryRestaurant);
      if (r) {
        setCurrentRestaurantId(r.id); // CRITICAL: tell queries which restaurant
        return { source: 'query', restaurant: r };
      }
    }
    
    // 2. Check subdomain (e.g., marios.latavola.app)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      // Has a subdomain
      const subdomain = parts[0];
      // Skip vercel app subdomains
      if (subdomain !== 'la-tavola-xi') {
        const r = await fetchRestaurantBySubdomain(subdomain);
        if (r) {
          setCurrentRestaurantId(r.id);
          return { source: 'subdomain', restaurant: r };
        }
      }
    }
    
    // 3. Check URL path (e.g., /marios)
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length > 0) {
      const slug = pathParts[0];
      // Skip system paths
      const systemPaths = ['signup', 'login', 'admin', 'api', 'static'];
      if (!systemPaths.includes(slug)) {
        const r = await fetchRestaurantBySlug(slug);
        if (r) {
          setCurrentRestaurantId(r.id);
          return { source: 'path', restaurant: r };
        }
      }
    }
  } catch (e) {
    console.warn('Restaurant URL detection error:', e);
  }
  
  return null;
}

// Find restaurant by slug
export async function fetchRestaurantBySlug(slug) {
  if (!slug) return null;
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug.toLowerCase().trim())
    .maybeSingle();
  return data;
}

// Get all active restaurants (for directory page)
export async function fetchPublicRestaurants() {
  const { data } = await supabase
    .from('restaurants')
    .select('id, name, slug, subdomain, cuisine_type, brand_color, address, phone')
    .eq('active', true)
    .order('name');
  return data || [];
}

// Update restaurant's online ordering settings
export async function updateRestaurantOrderTypes(restaurantId, settings) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({
      enable_dinein: settings.dinein !== false,
      enable_takeaway: settings.takeaway !== false,
      enable_delivery: settings.delivery !== false,
      enable_online_ordering: settings.onlineOrdering !== false,
    })
    .eq('id', restaurantId)
    .select()
    .single();
  return { data, error };
}

// ===========================================================
// SUPER ADMIN PANEL - Platform owner functionality
// ===========================================================

// Check if currently logged in user is a super admin
export async function isSuperAdmin() {
  const owner = getCurrentOwner();
  if (!owner) return false;
  try {
    const { data } = await supabase
      .from('restaurant_owners')
      .select('is_super_admin')
      .eq('id', owner.id)
      .maybeSingle();
    return data?.is_super_admin === true;
  } catch (e) {
    return false;
  }
}

// Get all restaurants with comprehensive stats for super admin panel
export async function fetchAllRestaurantsWithStats() {
  try {
    // Get all restaurants
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!restaurants) return [];
    
    // For each restaurant, get stats
    const enriched = await Promise.all(restaurants.map(async (r) => {
      const stats = {};
      
      // Get menu count
      const { count: menuCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', r.id);
      stats.menu_count = menuCount || 0;
      
      // Get table count
      const { count: tableCount } = await supabase
        .from('restaurant_tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', r.id);
      stats.table_count = tableCount || 0;
      
      // Get order count + revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total, paid, status, refunded, voided, created_at')
        .eq('restaurant_id', r.id);
      
      stats.orders_total = orders?.length || 0;
      stats.revenue = (orders || [])
        .filter(o => o.paid && o.status !== 'cancelled' && !o.refunded && !o.voided)
        .reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
      
      // Last order date
      const lastOrder = (orders || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];
      stats.last_activity = lastOrder?.created_at || r.updated_at || r.created_at;
      
      // Get owner info
      const { data: owner } = await supabase
        .from('restaurant_owners')
        .select('email, full_name, last_login')
        .eq('restaurant_id', r.id)
        .maybeSingle();
      stats.owner_email = owner?.email || r.owner_email || 'unknown';
      stats.owner_name = owner?.full_name || r.owner_name || 'Unknown';
      
      // Trial calculations
      if (r.plan === 'trial' && r.trial_ends_at) {
        const trialEnd = new Date(r.trial_ends_at);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        stats.trial_days_left = daysLeft;
        stats.trial_status = daysLeft < 0 ? 'expired' : daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'warning' : 'ok';
      }
      
      return { ...r, stats };
    }));
    
    return enriched;
  } catch (e) {
    console.error('fetchAllRestaurantsWithStats error:', e);
    return [];
  }
}

// Calculate platform-wide stats
export async function fetchPlatformStats() {
  try {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('plan, trial_ends_at, active, created_at');
    
    if (!restaurants) return {};
    
    const now = new Date();
    const planPrices = { starter: 29, pro: 69, enterprise: 149 };
    
    const stats = {
      total: restaurants.length,
      active: restaurants.filter(r => r.active !== false).length,
      trial: restaurants.filter(r => r.plan === 'trial').length,
      paid: restaurants.filter(r => r.plan && r.plan !== 'trial').length,
      mrr: restaurants
        .filter(r => r.plan && r.plan !== 'trial' && r.active !== false)
        .reduce((s, r) => s + (planPrices[r.plan] || 0), 0),
      signups_last_7d: restaurants.filter(r => {
        const created = new Date(r.created_at);
        return (now - created) / (1000 * 60 * 60 * 24) <= 7;
      }).length,
      signups_last_30d: restaurants.filter(r => {
        const created = new Date(r.created_at);
        return (now - created) / (1000 * 60 * 60 * 24) <= 30;
      }).length,
      trials_expiring_soon: restaurants.filter(r => {
        if (r.plan !== 'trial' || !r.trial_ends_at) return false;
        const days = (new Date(r.trial_ends_at) - now) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 3;
      }).length,
    };
    
    return stats;
  } catch (e) {
    console.error('fetchPlatformStats error:', e);
    return {};
  }
}

// Log an admin action
export async function logPlatformActivity(adminEmail, action, restaurantId, restaurantName, details = {}) {
  try {
    await supabase.from('platform_activity').insert({
      admin_email: adminEmail,
      action: action,
      target_restaurant_id: restaurantId,
      target_restaurant_name: restaurantName,
      details: details,
    });
  } catch (e) {
    console.warn('Failed to log activity:', e);
  }
}

// Get recent platform activity
export async function fetchPlatformActivity(limit = 50) {
  try {
    const { data } = await supabase
      .from('platform_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch (e) {
    return [];
  }
}

// Update restaurant plan (manual billing)
export async function updateRestaurantPlan(restaurantId, plan, adminEmail) {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ plan: plan, updated_at: new Date().toISOString() })
      .eq('id', restaurantId)
      .select()
      .single();
    
    if (data) {
      await logPlatformActivity(adminEmail, 'plan_changed', restaurantId, data.name, { new_plan: plan });
    }
    return { data, error };
  } catch (e) {
    return { error: e };
  }
}

// Toggle restaurant active status (suspend/activate)
export async function toggleRestaurantActive(restaurantId, active, adminEmail) {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ active: active, updated_at: new Date().toISOString() })
      .eq('id', restaurantId)
      .select()
      .single();
    
    if (data) {
      await logPlatformActivity(adminEmail, active ? 'restaurant_activated' : 'restaurant_suspended', restaurantId, data.name);
    }
    return { data, error };
  } catch (e) {
    return { error: e };
  }
}

// Impersonate a restaurant (login as them for support)
export async function impersonateRestaurant(restaurantId, adminEmail) {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();
    
    if (restaurant) {
      // Save current admin session for restoration
      const currentOwner = getCurrentOwner();
      try {
        localStorage.setItem('latavola_admin_backup', JSON.stringify({
          owner: currentOwner,
          restaurant: getCurrentSaasRestaurant(),
          timestamp: new Date().toISOString(),
        }));
        // Switch to target restaurant
        localStorage.setItem('latavola_saas_restaurant', JSON.stringify(restaurant));
        // Mark that we're in impersonation mode
        localStorage.setItem('latavola_impersonating', JSON.stringify({
          target_id: restaurant.id,
          target_name: restaurant.name,
          admin_email: adminEmail,
          started_at: new Date().toISOString(),
        }));
      } catch (e) {}
      
      setCurrentRestaurantId(restaurant.id);
      await logPlatformActivity(adminEmail, 'impersonate_started', restaurantId, restaurant.name);
      return restaurant;
    }
    return null;
  } catch (e) {
    console.error('Impersonation failed:', e);
    return null;
  }
}

// Stop impersonation - restore original admin session
export async function stopImpersonation() {
  try {
    const backup = localStorage.getItem('latavola_admin_backup');
    const impersonation = localStorage.getItem('latavola_impersonating');
    
    if (impersonation) {
      const imp = JSON.parse(impersonation);
      await logPlatformActivity(imp.admin_email, 'impersonate_ended', imp.target_id, imp.target_name);
    }
    
    if (backup) {
      const data = JSON.parse(backup);
      if (data.restaurant) {
        localStorage.setItem('latavola_saas_restaurant', JSON.stringify(data.restaurant));
        setCurrentRestaurantId(data.restaurant.id);
      }
    }
    
    localStorage.removeItem('latavola_admin_backup');
    localStorage.removeItem('latavola_impersonating');
    localStorage.removeItem('latavola_branch');
    localStorage.removeItem('latavola_user');
  } catch (e) {
    console.error('Stop impersonation error:', e);
  }
}

// Check if currently impersonating
export function isImpersonating() {
  try {
    return JSON.parse(localStorage.getItem('latavola_impersonating') || 'null');
  } catch (e) {
    return null;
  }
}
