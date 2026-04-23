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

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('display_order', { ascending: true });
  if (error) console.error('fetchCategories error:', error);
  return data || [];
}

export async function saveMenuItem(item) {
  const payload = {
    restaurant_id: RESTAURANT_ID,
    name: item.name,
    description: item.desc || null,
    price: item.price,
    icon: item.icon || 'cart',
    stock: item.stock || 20,
    available: item.avail !== false,
    allergens: item.allergens || [],
    sizes: item.sizes || [],
    extras: item.extras || [],
    cooking_opts: item.cookingOpts || [],
  };
  const { data, error } = await supabase.from('menu_items').upsert(payload).select().single();
  if (error) console.error('saveMenuItem error:', error);
  return { data, error };
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) console.error('deleteMenuItem error:', error);
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
