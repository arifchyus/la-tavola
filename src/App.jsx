import{useState,useEffect,useRef,useCallback}from"react";
// eslint-disable-next-line no-unused-vars
import{saveOrderToDb,fetchOrders,updateOrderStatus as dbUpdateOrderStatus,submitReview as dbSubmitReview,fetchReviews as dbFetchReviews,fetchMenu as dbFetchMenu,saveMenuItem as dbSaveMenuItem,deleteMenuItem as dbDeleteMenuItem,fetchCategories as dbFetchCategories,saveCategory as dbSaveCategory,deleteCategory as dbDeleteCategory,fetchSetMeals as dbFetchSetMeals,saveSetMeal as dbSaveSetMeal,deleteSetMeal as dbDeleteSetMeal,fetchOpeningHours as dbFetchHours,saveOpeningHours as dbSaveHours,saveReservation as dbSaveReservation,fetchReservations as dbFetchReservations,updateReservationStatus as dbUpdateReservationStatus,fetchTables as dbFetchTables,updateTableStatus as dbUpdateTableStatus,saveTable as dbSaveTable,deleteTable as dbDeleteTable,updateOrderPayment as dbUpdateOrderPayment,registerCustomer as dbRegisterCustomer,loginCustomer as dbLoginCustomer,fetchAllDeliverySettings as dbFetchAllDelivery,saveDeliverySettings as dbSaveDelivery,fetchDiscountCodes as dbFetchCodes,saveDiscountCode as dbSaveCode,deleteDiscountCode as dbDeleteCode,fetchAutoDiscounts as dbFetchAutoDiscounts,saveAutoDiscount as dbSaveAutoDiscount,fetchCustomers as dbFetchCustomers,saveCustomer as dbSaveCustomer,updateCustomerStats as dbUpdateCustomerStats,deleteAutoDiscount as dbDeleteAutoDiscount,fetchStations as dbFetchStations,saveStation as dbSaveStation,deleteStation as dbDeleteStation,updateStationProgress as dbUpdateStationProgress,verifyDeliveryCode as dbVerifyCode,recordCashCollected as dbRecordCash,fetchCashHandovers as dbFetchHandovers,recordCashHandover as dbRecordHandover,fetchCustomerLoyalty as dbFetchLoyalty,awardLoyaltyPoints as dbAwardPoints,redeemLoyaltyPoints as dbRedeemPoints,fetchLoyaltyHistory as dbLoyaltyHistory,fetchDietaryPrefs as dbFetchPrefs,saveDietaryPrefs as dbSavePrefs,fetchSchedules as dbFetchSchedules,saveSchedule as dbSaveSchedule,deleteSchedule as dbDeleteSchedule,clockIn as dbClockIn,clockOut as dbClockOut,fetchClockRecords as dbFetchClockRecords,fetchCurrentlyClockedIn as dbFetchClockedIn,fetchBranchHours as dbFetchBranchHours,saveBranchHours as dbSaveBranchHours,deleteBranchHours as dbDeleteBranchHours,fetchBranchHolidays as dbFetchHolidays,saveBranchHoliday as dbSaveHoliday,deleteBranchHoliday as dbDeleteHoliday,fetchBranchHoursConfig as dbFetchHoursConfig,saveBranchHoursConfig as dbSaveHoursConfig,recordPayment as dbRecordPayment,openShift as dbOpenShift,closeShift as dbCloseShift,fetchOpenShift as dbFetchOpenShift,fetchShifts as dbFetchShifts,updateShiftSales as dbUpdateShiftSales,recordVoid as dbRecordVoid,verifyManagerPin as dbVerifyPin,recordDrawerEvent as dbRecordDrawer}from"./supabaseClient";

//  OFFLINE STORAGE 
// Safe localStorage wrappers - fail silently in sandboxed environments
var LS={
  get:k=>{try{var v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}},
  del:k=>{try{localStorage.removeItem(k);}catch(e){}},
};

// Detect online status
var isOnline=()=>typeof navigator!=="undefined"&&navigator.onLine!==false;

// Offline order queue - stored until internet returns
var OFFLINE_QUEUE_KEY="latavola_offline_queue";
var queueOffline=order=>{
  var q=LS.get(OFFLINE_QUEUE_KEY)||[];
  q.push({...order,queuedAt:Date.now()});
  LS.set(OFFLINE_QUEUE_KEY,q);
  return q.length;
};
var getQueue=()=>LS.get(OFFLINE_QUEUE_KEY)||[];
var clearQueue=()=>LS.del(OFFLINE_QUEUE_KEY);

// String.fromCharCode with surrogate pairs - CONFIRMED WORKING in emoji-test.jsx
var EM={
  // Original
  squid:String.fromCharCode(0xD83E,0xDD91),tomato:String.fromCharCode(0xD83C,0xDF45),
  soup:String.fromCharCode(0xD83C,0xDF72),pizza:String.fromCharCode(0xD83C,0xDF55),
  burger:String.fromCharCode(0xD83C,0xDF54),fish:String.fromCharCode(0xD83D,0xDC1F),
  pasta:String.fromCharCode(0xD83C,0xDF5D),fries:String.fromCharCode(0xD83C,0xDF5F),
  salad:String.fromCharCode(0xD83E,0xDD57),coffee:String.fromCharCode(0x2615),
  choc:String.fromCharCode(0xD83C,0xDF6B),drink:String.fromCharCode(0xD83E,0xDD64),
  water:String.fromCharCode(0xD83D,0xDCA7),cart:String.fromCharCode(0xD83D,0xDED2),
  pin:String.fromCharCode(0xD83D,0xDCCD),cal:String.fromCharCode(0xD83D,0xDCC5),
  star:String.fromCharCode(0x2B50),person:String.fromCharCode(0xD83D,0xDC64),
  chat:String.fromCharCode(0xD83D,0xDCAC),cook:String.fromCharCode(0xD83C,0xDF73),
  gear:String.fromCharCode(0x2699),chart:String.fromCharCode(0xD83D,0xDCCA),
  party:String.fromCharCode(0xD83C,0xDF89),bag:String.fromCharCode(0xD83D,0xDECD),
  wave:String.fromCharCode(0xD83D,0xDC4B),pound:String.fromCharCode(0x00A3),
  // Indian / South Asian food
  curry:String.fromCharCode(0xD83C,0xDF5B),       // rice curry
  rice:String.fromCharCode(0xD83C,0xDF5A),        // cooked rice
  ricebowl:String.fromCharCode(0xD83C,0xDF5A),
  naan:String.fromCharCode(0xD83E,0xDED3),        // flatbread
  flatbread:String.fromCharCode(0xD83E,0xDED3),
  samosa:String.fromCharCode(0xD83E,0xDD60),       // dumpling (closest)
  dumpling:String.fromCharCode(0xD83E,0xDD5F),
  falafel:String.fromCharCode(0xD83E,0xDDC6),
  shawarma:String.fromCharCode(0xD83E,0xDD59),     // stuffed flatbread
  kebab:String.fromCharCode(0xD83C,0xDF62),        // oden (skewer)
  skewer:String.fromCharCode(0xD83C,0xDF62),
  chicken:String.fromCharCode(0xD83C,0xDF57),      // chicken leg
  chickenleg:String.fromCharCode(0xD83C,0xDF57),
  meat:String.fromCharCode(0xD83E,0xDD69),         // cut of meat
  bacon:String.fromCharCode(0xD83E,0xDD53),
  egg:String.fromCharCode(0xD83E,0xDD5A),          // egg
  friedegg:String.fromCharCode(0xD83C,0xDF73),     // cooking
  cheese:String.fromCharCode(0xD83E,0xDDC0),
  // Rice dishes
  bento:String.fromCharCode(0xD83C,0xDF71),        // looks like thali
  thali:String.fromCharCode(0xD83C,0xDF71),        // bento box - works for thali
  // Breads / starters
  bread:String.fromCharCode(0xD83C,0xDF5E),        // bread loaf
  bagel:String.fromCharCode(0xD83E,0xDD6F),
  croissant:String.fromCharCode(0xD83E,0xDD50),
  pretzel:String.fromCharCode(0xD83E,0xDD68),
  // Mains
  sushi:String.fromCharCode(0xD83C,0xDF63),
  noodles:String.fromCharCode(0xD83C,0xDF5C),
  ramen:String.fromCharCode(0xD83C,0xDF5C),
  steak:String.fromCharCode(0xD83E,0xDD69),
  bowl:String.fromCharCode(0xD83E,0xDD58),         // shallow bowl with spoon
  pot:String.fromCharCode(0xD83C,0xDF72),          // pot of food
  // Sides
  corn:String.fromCharCode(0xD83C,0xDF3D),
  carrot:String.fromCharCode(0xD83E,0xDD55),
  potato:String.fromCharCode(0xD83E,0xDD54),
  broccoli:String.fromCharCode(0xD83E,0xDD66),
  onion:String.fromCharCode(0xD83E,0xDDC5),
  garlic:String.fromCharCode(0xD83E,0xDDC4),
  chili:String.fromCharCode(0xD83C,0xDF36),        // hot pepper
  pepper:String.fromCharCode(0xD83C,0xDF36),
  // Desserts
  cake:String.fromCharCode(0xD83C,0xDF70),
  shortcake:String.fromCharCode(0xD83C,0xDF70),
  cupcake:String.fromCharCode(0xD83E,0xDDC1),
  donut:String.fromCharCode(0xD83C,0xDF69),
  cookie:String.fromCharCode(0xD83C,0xDF6A),
  icecream:String.fromCharCode(0xD83C,0xDF68),
  sweet:String.fromCharCode(0xD83C,0xDF6C),        // candy
  pudding:String.fromCharCode(0xD83C,0xDF6E),      // custard/flan
  honey:String.fromCharCode(0xD83C,0xDF6F),
  lolly:String.fromCharCode(0xD83C,0xDF6D),
  // Drinks
  tea:String.fromCharCode(0xD83C,0xDF75),          // teacup - perfect for chai
  chai:String.fromCharCode(0xD83C,0xDF75),
  milk:String.fromCharCode(0xD83E,0xDD5B),
  beer:String.fromCharCode(0xD83C,0xDF7A),
  wine:String.fromCharCode(0xD83C,0xDF77),
  cocktail:String.fromCharCode(0xD83C,0xDF78),
  tropical:String.fromCharCode(0xD83C,0xDF79),     // tropical drink
  champagne:String.fromCharCode(0xD83C,0xDF7E),
  bottle:String.fromCharCode(0xD83C,0xDF7E),
  sake:String.fromCharCode(0xD83C,0xDF76),
  juice:String.fromCharCode(0xD83E,0xDDC3),        // beverage box
  bubbletea:String.fromCharCode(0xD83E,0xDDCB),
  matcha:String.fromCharCode(0xD83C,0xDF75),
  // Fruits
  apple:String.fromCharCode(0xD83C,0xDF4E),
  banana:String.fromCharCode(0xD83C,0xDF4C),
  mango:String.fromCharCode(0xD83E,0xDD6D),        // mango
  coconut:String.fromCharCode(0xD83E,0xDD65),
  lemon:String.fromCharCode(0xD83C,0xDF4B),
  orange:String.fromCharCode(0xD83C,0xDF4A),
  grape:String.fromCharCode(0xD83C,0xDF47),
  watermelon:String.fromCharCode(0xD83C,0xDF49),
  strawberry:String.fromCharCode(0xD83C,0xDF53),
  pineapple:String.fromCharCode(0xD83C,0xDF4D),
  // Nuts & seeds
  peanuts:String.fromCharCode(0xD83E,0xDD5C),
  // Halal / dietary indicator icons
  fire:String.fromCharCode(0xD83D,0xDD25),         // spicy
  spicy:String.fromCharCode(0xD83C,0xDF36),        // hot pepper
  leaf:String.fromCharCode(0xD83C,0xDF43),         // vegetarian
  veg:String.fromCharCode(0xD83C,0xDF31),          // seedling
  money:String.fromCharCode(0xD83D,0xDCB0),
  phone:String.fromCharCode(0xD83D,0xDCDE),
  clock:String.fromCharCode(0xD83D,0xDD52),        // 3 o'clock
  check:String.fromCharCode(0x2705),
  cross:String.fromCharCode(0x274C),
};
var fmt=n=>{var v=Number(n);return EM.pound+(isNaN(v)?"0.00":v.toFixed(2));};
var nowT=()=>new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
var uid=()=>"ORD-"+Math.floor(Math.random()*90000+10000);
var rid=()=>"RES-"+Math.floor(Math.random()*9000+1000);

// eslint-disable-next-line no-unused-vars
var MENU=[
  {id:1,cat:"Starters",name:"Crispy Calamari",price:8.99,desc:"Lightly breaded with aioli",icon:"squid",avail:true,stock:20},
  {id:2,cat:"Starters",name:"Bruschetta",price:6.49,desc:"Tomato, basil and mozzarella",icon:"tomato",avail:true,stock:15},
  {id:3,cat:"Starters",name:"Soup of the Day",price:5.99,desc:"Rotating seasonal selection",icon:"soup",avail:true,stock:8},
  {id:4,cat:"Mains",name:"Margherita Pizza",price:13.99,desc:"San Marzano tomato, fior di latte",icon:"pizza",avail:true,stock:25},
  {id:5,cat:"Mains",name:"Beef Burger",price:14.99,desc:"6oz patty, cheddar, lettuce, tomato",icon:"burger",avail:true,stock:18},
  {id:6,cat:"Mains",name:"Grilled Salmon",price:18.99,desc:"Lemon butter, seasonal veg",icon:"fish",avail:true,stock:10},
  {id:7,cat:"Mains",name:"Pasta Carbonara",price:12.99,desc:"Pancetta, egg, pecorino",icon:"pasta",avail:true,stock:20},
  {id:8,cat:"Sides",name:"Truffle Fries",price:4.99,desc:"Parmesan and truffle oil",icon:"fries",avail:true,stock:30},
  {id:9,cat:"Sides",name:"Garden Salad",price:4.49,desc:"Mixed leaves, cucumber, tomato",icon:"salad",avail:true,stock:20},
  {id:10,cat:"Desserts",name:"Tiramisu",price:6.99,desc:"Espresso and mascarpone",icon:"coffee",avail:true,stock:12},
  {id:11,cat:"Desserts",name:"Choc Lava Cake",price:7.49,desc:"Warm centre, vanilla ice cream",icon:"choc",avail:true,stock:10},
  {id:12,cat:"Drinks",name:"Soft Drink",price:2.99,desc:"Cola, Lemonade, OJ",icon:"drink",avail:true,stock:50},
  {id:13,cat:"Drinks",name:"Sparkling Water",price:1.99,desc:"500ml bottle",icon:"water",avail:true,stock:40},
];
var BRANCHES=[
  {id:"b1",name:"City Centre",addr:"12 King Street, London EC2A",phone:"020 7123 4567",lat:51.5195,lng:-0.0876,
    delivery:{enabled:true,method:"postcode",postcodes:["EC1","EC2","EC3","EC4","E1","E14","N1"],radius:0,zones:[],flatFee:2.50,freeOver:25,minOrder:15},
    cod:{enabled:true,minOrder:15,maxMiles:3}},
  {id:"b2",name:"Canary Wharf",addr:"One Canada Square, London E14",phone:"020 7987 6543",lat:51.5049,lng:-0.0195,
    delivery:{enabled:true,method:"radius",postcodes:[],radius:3,zones:[],flatFee:0,freeOver:0,minOrder:10},
    cod:{enabled:false,minOrder:20,maxMiles:2}},
  {id:"b3",name:"Shoreditch",addr:"45 Brick Lane, London E1",phone:"020 3456 7890",lat:51.5209,lng:-0.0717,
    delivery:{enabled:true,method:"zone",postcodes:[],radius:0,
      zones:[{id:"z1",name:"Zone 1",maxMiles:3,fee:0},{id:"z2",name:"Zone 2",maxMiles:5,fee:2.50},{id:"z3",name:"Zone 3",maxMiles:7,fee:4.50}],
      flatFee:0,freeOver:35,minOrder:20},
    cod:{enabled:true,minOrder:20,maxMiles:3}},
];

// Check if COD is allowed for this branch + order
// Check if QR table session is valid (not expired, table still active)
// Returns {valid, table, branch, reason}
function getQrSession(){
  if(typeof window==="undefined")return{valid:false};
  var params=new URLSearchParams(window.location.search);
  var qrTable=params.get("table");
  var qrBranch=params.get("branch");
  if(!qrTable||!qrBranch)return{valid:false};
  // Check session start time - expires after 2 hours
  var sessionKey="qr_session_"+qrBranch+"_"+qrTable;
  var savedStart=null;
  try{savedStart=localStorage.getItem(sessionKey);}catch(e){}
  var now=Date.now();
  var TWO_HOURS=2*60*60*1000;
  if(!savedStart){
    // First visit - set start time
    try{localStorage.setItem(sessionKey,now.toString());}catch(e){}
    return{valid:true,table:qrTable,branch:qrBranch,fresh:true};
  }
  var started=parseInt(savedStart);
  if(isNaN(started)||now-started>TWO_HOURS){
    // Expired - clear
    try{localStorage.removeItem(sessionKey);}catch(e){}
    return{valid:false,reason:"expired"};
  }
  return{valid:true,table:qrTable,branch:qrBranch};
}

function clearQrSession(){
  if(typeof window==="undefined")return;
  var params=new URLSearchParams(window.location.search);
  var qrTable=params.get("table");
  var qrBranch=params.get("branch");
  if(qrTable&&qrBranch){
    try{localStorage.removeItem("qr_session_"+qrBranch+"_"+qrTable);}catch(e){}
  }
  // Also remove from URL
  if(window.history&&window.history.replaceState){
    window.history.replaceState({},"",window.location.pathname);
  }
}

// Get the right price for a menu item based on order type
// Falls back to base price if specific not set
function getItemPrice(item,orderType){
  if(!item)return 0;
  var base=parseFloat(item.price)||0;
  // Helper - returns null if value is empty/zero/invalid, otherwise the parsed number
  var p=v=>{var n=parseFloat(v);return(isNaN(n)||n<=0)?null:n;};
  if(orderType==="dine-in"||orderType==="eatin"){
    var v=p(item.priceDineIn);
    return v!==null?v:base;
  }
  if(orderType==="collection"||orderType==="takeaway"){
    var v2=p(item.priceTakeaway);
    return v2!==null?v2:base;
  }
  if(orderType==="delivery"){
    var v3=p(item.priceDelivery);
    return v3!==null?v3:base;
  }
  return base;
}

// Check if item is available for the order type
function isItemAvailable(item,orderType){
  if(!item)return false;
  if(item.avail===false)return false; // master availability
  if(orderType==="dine-in"||orderType==="eatin"){
    return item.availDineIn!==false;
  }
  if(orderType==="collection"||orderType==="takeaway"){
    return item.availTakeaway!==false;
  }
  if(orderType==="delivery"){
    return item.availDelivery!==false;
  }
  return true;
}

// eslint-disable-next-line no-unused-vars
function checkCOD(branch,orderTotal,distance){
  var c=branch?.cod;
  if(!c||!c.enabled)return{ok:false,reason:"Cash on delivery not accepted here"};
  if(c.minOrder&&orderTotal<c.minOrder)return{ok:false,reason:"Min order "+(c.minOrder)+" for cash on delivery"};
  if(c.maxMiles&&distance!=null&&distance>c.maxMiles)return{ok:false,reason:"Cash on delivery only within "+c.maxMiles+" miles"};
  return{ok:true};
}

// ---- KITCHEN PRINTING -------------------------------------------------------
// Build HTML for a print ticket
function buildTicketHtml(order,station,branch,format){
  var isThermal=format==="thermal";
  var w=isThermal?"80mm":"210mm";
  var p=isThermal?"4mm":"15mm";
  var fontSize=isThermal?"11px":"13px";
  var headerSize=isThermal?"14px":"22px";
  var stationName=station?station.name:"";
  var items=order.items||[];
  // Filter items if station_only
  var content=station?(station.printContent||"station_only"):"full_order";
  var displayItems=items;
  var showAllSummary=false;
  if(station&&content==="station_only"){
    // We don't have menu lookup here, so this is best-effort filter via items[].station if set
    displayItems=items.filter(it=>!it.station||it.station===station.name);
  }else if(station&&content==="station_with_full_summary"){
    showAllSummary=true;
  }
  var typeLabel=order.type==="dine-in"?"DINE-IN":order.type==="delivery"?"DELIVERY":order.type==="collection"?"COLLECTION":(order.type||"ORDER").toUpperCase();
  var copies=parseInt(station?.copies)||1;
  var copyText=copies>1?" ("+copies+" copies)":"";
  var html="<html><head><title>Order "+order.id+"</title><style>"+
    "@media print{@page{size:"+w+" auto;margin:0}body{margin:0}}"+
    "body{font-family:'Courier New',monospace;font-size:"+fontSize+";padding:"+p+";width:"+w+";color:#000}"+
    "h1{font-size:"+headerSize+";text-align:center;margin:0 0 8px}"+
    ".divider{border-top:1px dashed #000;margin:6px 0}"+
    ".big{font-size:"+(isThermal?"16px":"18px")+";font-weight:bold}"+
    ".item{display:flex;justify-content:space-between;margin:2px 0}"+
    ".section{font-weight:bold;text-decoration:underline;margin:6px 0 3px;text-transform:uppercase}"+
    "</style></head><body>";
  html+="<h1>"+(branch?branch.name:"LA TAVOLA")+"</h1>";
  if(stationName)html+="<div style='text-align:center;font-weight:bold;font-size:"+(isThermal?"13px":"16px")+"'>"+stationName.toUpperCase()+" STATION"+copyText+"</div>";
  html+="<div class='divider'></div>";
  html+="<div class='big'>ORDER "+order.id+"</div>";
  html+="<div>"+order.time+" - "+typeLabel+"</div>";
  if(order.tableId)html+="<div class='big'>TABLE "+order.tableId+"</div>";
  if(order.customer)html+="<div>Customer: "+order.customer+"</div>";
  if(order.phone)html+="<div>Phone: "+order.phone+"</div>";
  if(order.address)html+="<div>Address: "+(typeof order.address==="string"?order.address:(order.address.line1||"")+" "+(order.address.postcode||""))+"</div>";
  if(order.slot)html+="<div>Collect at: "+order.slot+"</div>";
  html+="<div class='divider'></div>";
  if(stationName&&content==="station_only"){
    html+="<div class='section'>"+stationName+" Items</div>";
  }else{
    html+="<div class='section'>Items</div>";
  }
  displayItems.forEach(it=>{
    html+="<div class='item'><span class='big'>"+(it.qty||1)+"x "+it.name+"</span></div>";
    if(it.notes)html+="<div style='padding-left:20px;font-style:italic'>Note: "+it.notes+"</div>";
    if(it.size)html+="<div style='padding-left:20px'>Size: "+it.size+"</div>";
  });
  if(showAllSummary){
    html+="<div class='divider'></div><div class='section'>Full Order Summary</div>";
    items.forEach(it=>{html+="<div class='item'><span>"+(it.qty||1)+"x "+it.name+"</span></div>";});
  }
  html+="<div class='divider'></div>";
  if(order.total)html+="<div class='item big'><span>TOTAL</span><span>"+(order.total?"\u00A3"+order.total.toFixed(2):"")+"</span></div>";
  if(order.payMethod==="cod")html+="<div style='text-align:center;font-weight:bold;border:2px solid #000;padding:4px;margin-top:6px'>** CASH ON DELIVERY **<br>COLLECT \u00A3"+(order.total||0).toFixed(2)+"</div>";
  if(!order.paid&&order.payMethod!=="cod")html+="<div style='text-align:center;font-weight:bold'>** UNPAID - COLLECT PAYMENT **</div>";
  html+="<div class='divider'></div>";
  html+="<div style='text-align:center;font-size:10px;margin-top:8px'>"+new Date().toLocaleString("en-GB")+"</div>";
  html+="</body></html>";
  return html;
}

// Print using browser
function printTicket(order,station,branch){
  var format=station?(station.printerFormat||"thermal"):"thermal";
  var html=buildTicketHtml(order,station,branch,format);
  var win=window.open("","print_"+order.id,"width=400,height=600");
  if(!win){alert("Pop-up blocked! Allow pop-ups to print.");return false;}
  win.document.write(html);
  win.document.close();
  // Trigger print after small delay so styles load
  setTimeout(()=>{try{win.focus();win.print();setTimeout(()=>win.close(),500);}catch(e){console.log("Print error:",e);}},250);
  return true;
}

// PrintNode integration (requires server-side or CORS proxy in real use)
function printViaPrintNode(order,station,branch,apiKey){
  // Note: PrintNode API requires HTTP Basic Auth, browser CORS may block direct calls.
  // For production, route through a server endpoint to avoid exposing apiKey.
  if(!station.printnodeId||!apiKey){
    alert("PrintNode not configured. Set printer ID and API key in Admin > Stations.");
    return false;
  }
  var format=station.printerFormat||"thermal";
  var html=buildTicketHtml(order,station,branch,format);
  // Convert HTML to base64
  var b64=btoa(unescape(encodeURIComponent(html)));
  var payload={
    printerId:parseInt(station.printnodeId),
    title:"Order "+order.id,
    contentType:"raw_base64",
    content:b64,
    source:"La Tavola POS",
    options:{copies:parseInt(station.copies)||1},
  };
  fetch("https://api.printnode.com/printjobs",{
    method:"POST",
    headers:{"Authorization":"Basic "+btoa(apiKey+":"),"Content-Type":"application/json"},
    body:JSON.stringify(payload),
  }).then(r=>r.json()).then(data=>{
    console.log("PrintNode result:",data);
  }).catch(e=>{
    console.log("PrintNode failed (likely CORS):",e);
    alert("PrintNode call failed. Production setup requires server-side proxy.");
  });
  return true;
}

// Main print dispatcher - routes to correct method based on station config
function dispatchPrint(order,station,branch){
  if(!station)return printTicket(order,null,branch);
  var method=station.printerMethod||"browser";
  if(method==="none")return false;
  if(method==="printnode"){
    var apiKey=null;
    try{apiKey=localStorage.getItem("printnode_api_key");}catch(e){}
    return printViaPrintNode(order,station,branch,apiKey);
  }
  // Default: browser print
  return printTicket(order,station,branch);
}

// Delivery helper - checks if an address is deliverable and returns fee
function checkDelivery(branch,address,orderTotal){
  var d=branch.delivery;
  if(!d||!d.enabled)return{ok:false,reason:"No delivery from this branch"};
  if(d.minOrder&&orderTotal<d.minOrder)return{ok:false,reason:"Min order "+fmt(d.minOrder)+" for delivery"};
  var fee=d.flatFee||0,zone=null,distance=null;

  if(d.method==="postcode"){
    var pc=(address.postcode||"").toUpperCase().replace(/\s+/g,"");
    var match=d.postcodes.find(p=>pc.startsWith(p.replace(/\s+/g,"").toUpperCase()));
    if(!match)return{ok:false,reason:"Out of delivery area - postcode not covered"};
  }else if(d.method==="radius"){
    distance=address.distance||0;
    if(distance>d.radius)return{ok:false,reason:"Too far - max "+d.radius+" miles"};
  }else if(d.method==="zone"){
    distance=address.distance||0;
    zone=d.zones.find(z=>distance<=z.maxMiles);
    if(!zone)return{ok:false,reason:"Out of all delivery zones"};
    fee=zone.fee;
  }

  if(d.freeOver&&orderTotal>=d.freeOver)fee=0;
  return{ok:true,fee,zone:zone?.name,distance};
}

var HOURS={
  b1:{Mon:[11,22],Tue:[11,22],Wed:[11,22],Thu:[11,23],Fri:[11,23],Sat:[10,23],Sun:[10,21]},
  b2:{Mon:[7,22],Tue:[7,22],Wed:[7,22],Thu:[7,22],Fri:[7,23],Sat:[9,23],Sun:[10,20]},
  b3:{Mon:[12,22],Tue:[12,22],Wed:[12,23],Thu:[12,23],Fri:[12,24],Sat:[11,24],Sun:[11,21]},
};
var DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var isOpenNow=id=>{var h=HOURS[id];if(!h)return true;var d=DAYS[new Date().getDay()],hrs=h[d];if(!hrs)return false;var c=new Date().getHours()+new Date().getMinutes()/60;return c>=hrs[0]&&c<hrs[1];};
// Not used in UI but kept for potential future use
// eslint-disable-next-line no-unused-vars
var isOpen=id=>true;
var USERS=[
  {id:"u1",name:"Alex Johnson",email:"alex@example.com",pw:"pass123",avatar:"AJ",role:"customer"},
  {id:"u2",name:"Sarah Lee",email:"sarah@example.com",pw:"pass123",avatar:"SL",role:"customer"},
  {id:"s1",name:"Marco Rossi",email:"marco@staff.com",pw:"staff123",avatar:"MR",role:"owner"},
  {id:"s2",name:"Chef Paolo",email:"chef@staff.com",pw:"chef123",avatar:"CP",role:"kitchen"},
];
// eslint-disable-next-line no-unused-vars
var DISCOUNTS=[
  {code:"WELCOME10",type:"percent",value:10,desc:"10% off",active:true,uses:0,max:100},
  {code:"FLAT5",type:"fixed",value:5,desc:"5 off orders over 25",active:true,uses:0,max:500,minOrder:25},
];
// eslint-disable-next-line no-unused-vars
var ORDERS0=[
  {id:"ORD-1001",branchId:"b1",userId:"u1",customer:"Table 3",items:[{id:4,name:"Margherita Pizza",qty:2,price:13.99},{id:8,name:"Truffle Fries",qty:1,price:4.99}],total:32.97,status:"preparing",time:"12:45",type:"dine-in",paid:true,slot:null},
  {id:"ORD-1002",branchId:"b1",userId:"u2",customer:"John Smith",items:[{id:5,name:"Beef Burger",qty:1,price:14.99},{id:12,name:"Soft Drink",qty:2,price:2.99}],total:20.97,status:"ready",time:"12:50",type:"takeaway",paid:true,slot:null},
  {id:"ORD-1003",branchId:"b2",userId:"u1",customer:"Table 7",items:[{id:6,name:"Grilled Salmon",qty:1,price:18.99}],total:18.99,status:"pending",time:"13:02",type:"collection",paid:false,slot:"13:30"},
];
var SL={pending:"Pending",preparing:"Preparing",ready:"Ready",delivered:"Delivered",collected:"Collected",cancelled:"Cancelled"};
var SC={pending:"#d97706",preparing:"#2563eb",ready:"#059669",delivered:"#6b7280",collected:"#7c3aed",cancelled:"#dc2626"};
var SB={pending:"#fef3c7",preparing:"#eff6ff",ready:"#d1fae5",delivered:"#f3f4f6",collected:"#f5f3ff",cancelled:"#fee2e2"};
var TIERS=[{name:"Bronze",min:0,color:"#b45309",bg:"#fef3c7"},{name:"Silver",min:200,color:"#6b7280",bg:"#f3f4f6"},{name:"Gold",min:500,color:"#d4952a",bg:"#fffbeb"},{name:"Platinum",min:1000,color:"#7c3aed",bg:"#f5f3ff"}];
var getTier=pts=>[...TIERS].reverse().find(t=>pts>=t.min)||TIERS[0];
var getSlots=()=>{var s=[],now=new Date(),st=new Date(now);st.setMinutes(Math.ceil(st.getMinutes()/15)*15+15,0,0);for(var i=0;i<10;i++){var t=new Date(st.getTime()+i*15*60000);s.push(("0"+t.getHours()).slice(-2)+":"+("0"+t.getMinutes()).slice(-2));}return s;};
var applyDisc=(ds,code,sub)=>{var d=ds.find(d=>d.code===code.toUpperCase()&&d.active);if(!d)return{err:"Invalid code."};if(d.minOrder&&sub<d.minOrder)return{err:"Min order "+fmt(d.minOrder)};var sv=d.type==="percent"?sub*(d.value/100):d.value;return{saving:Math.min(sv,sub),desc:d.desc,code:d.code};};

var CSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f7f3ee;color:#1a1208;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'Playfair Display',serif}
button{cursor:pointer;border:none;background:none;font-family:inherit}
input,select,textarea{font-family:inherit;font-size:14px}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#d4c9b8;border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes flashPulse{0%,100%{box-shadow:0 0 0 2px #dc2626,0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 2px #dc2626,0 0 0 10px rgba(220,38,38,0)}}
@keyframes flashGreen{0%{background:#d1fae5;transform:scale(1)}30%{background:#a7f3d0;transform:scale(1.03)}100%{background:transparent;transform:scale(1)}}
@keyframes slideInTop{0%{opacity:0;transform:translateY(-20px);background:#d1fae5}100%{opacity:1;transform:translateY(0);background:transparent}}
.flash{animation:flashGreen .6s ease both}
.cart-item-new{animation:slideInTop .4s ease-out both}
.fadeup{animation:fadeUp .3s ease both}
.card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid #ede8de}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:9px;font-weight:600;font-size:14px;cursor:pointer;border:none;transition:all .18s}
.btn-r{background:#bf4626;color:#fff}.btn-r:hover{background:#a33a1e;transform:translateY(-1px)}
.btn-d{background:#1a1208;color:#fff}.btn-d:hover{background:#2e2218}
.btn-p{background:#7c3aed;color:#fff}
.btn-o{border:2px solid #e8e0d4;color:#1a1208;background:#fff}.btn-o:hover{background:#1a1208;color:#fff;border-color:#1a1208}
.btn-g{color:#8a8078;padding:8px 12px}.btn-g:hover{background:#f0ebe3;border-radius:8px}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}
.field{width:100%;padding:10px 13px;border:2px solid #e8e0d4;border-radius:9px;font-size:14px;background:#fff;color:#1a1208;outline:none;transition:border-color .15s}
.field:focus{border-color:#bf4626}
.lbl{display:block;font-size:11px;font-weight:700;color:#8a8078;letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px}
.bdg{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
.page{max-width:940px;margin:0 auto;padding:20px 14px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.ag{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.hr{height:1px;background:#ede8de;margin:12px 0}
.nav{background:#1a1208;height:58px;display:flex;align-items:center;padding:0 16px;position:sticky;top:0;z-index:500;gap:8px;box-shadow:0 2px 16px rgba(0,0,0,.3)}
.nlogo{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#d4952a;flex-shrink:0}
.ntabs{display:flex;gap:2px;flex:1;justify-content:center;overflow-x:auto}
.ntabs::-webkit-scrollbar{display:none}
.ntab{padding:6px 12px;border-radius:7px;font-size:12px;font-weight:600;color:#888;background:transparent;border:none;white-space:nowrap;cursor:pointer;transition:all .18s}
.ntab.on{background:#bf4626;color:#fff}
.ntab:hover:not(.on){color:#fff;background:rgba(255,255,255,.1)}
.nright{display:flex;align-items:center;gap:6px;flex-shrink:0}
.av{background:#bf4626;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.mnav{display:none}.hmob{display:flex}
@media(max-width:680px){
  .mnav{display:flex;position:fixed;bottom:0;left:0;right:0;background:#1a1208;border-top:1px solid #2e2218;z-index:400;overflow-x:auto;padding-bottom:env(safe-area-inset-bottom,0px)}
  .mnav::-webkit-scrollbar{display:none}
  .mbtn{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 16px;font-size:10px;font-weight:600;color:#555;border:none;background:transparent;cursor:pointer;white-space:nowrap;transition:color .15s}
  .mbtn.on{color:#d4952a}.mico{font-size:22px;line-height:1.1}
  .hmob{display:none!important}.ntabs{display:none!important}
  main{padding-bottom:72px!important}
}
@media(max-width:560px){.g2,.g3{grid-template-columns:1fr}.ag{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}}
.kbg{background:#0a0a0a;min-height:100vh;padding:14px}
.lbar{height:7px;background:#ede8de;border-radius:4px;overflow:hidden}
.lfill{height:100%;border-radius:4px;transition:width .8s}

/* POS responsive layout - LOCKED TO VIEWPORT so cart footer stays visible */
.pos-wrap{height:calc(100vh - 58px);background:#f0ebe0;display:flex;flex-direction:column;overflow:hidden}
.pos-body{display:flex;flex:1;overflow:hidden;min-height:0}
.pos-menu{flex:1 1 60%;padding:12px;overflow-y:auto;min-height:0}
.pos-cart{flex:1 1 40%;background:#fff;display:flex;flex-direction:column;border-left:1px solid #ede8de;max-width:400px;min-width:300px;min-height:0}
.pos-cart-items{flex:1;overflow-y:auto;padding:8px 12px;min-height:0}
.pos-cart-footer{padding:12px;border-top:1px solid #ede8de;background:#f7f3ee;flex-shrink:0}
.pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}

/* Phone: stack vertically, cart slides over menu */
@media(max-width:700px){
  .pos-wrap{height:auto;min-height:calc(100vh - 58px);overflow:visible}
  .pos-body{flex-direction:column;overflow:visible}
  .pos-cart{max-width:100%;min-width:0;border-left:none;border-top:2px solid #ede8de}
  .pos-cart-items{max-height:35vh}
  .pos-grid{grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:6px}
}

/* Tablet portrait: smaller cart, bigger menu buttons */
@media(min-width:701px) and (max-width:1024px){
  .pos-cart{flex:0 0 340px;max-width:340px}
  .pos-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
}

/* Desktop / large tablet: balanced layout */
@media(min-width:1025px) and (max-width:1440px){
  .pos-cart{flex:0 0 380px;max-width:380px}
  .pos-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
}

/* Large EPOS / monitor: maximum menu density */
@media(min-width:1441px){
  .pos-cart{flex:0 0 440px;max-width:440px}
  .pos-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
}

/* Landscape phone: side-by-side */
@media(max-width:900px) and (orientation:landscape) and (max-height:500px){
  .pos-body{flex-direction:row}
  .pos-cart{max-width:280px;min-width:260px;max-height:none;border-top:none;border-left:1px solid #ede8de}
  .pos-grid{grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:5px}
}
`;

function printR(o,b){
  var w=window.open("","_blank","width=380,height=640");if(!w)return;
  var rows=o.items.map(i=>`<tr><td>${i.name} x${i.qty}</td><td>${fmt(i.price*i.qty)}</td></tr>`).join("");
  var sub=o.subtotal||o.total, disc=o.discount||0, tip=o.tip||0;
  var breakdown="";
  if(sub&&(disc||tip)){
    breakdown=`<tr><td>Subtotal</td><td>${fmt(sub)}</td></tr>`;
    if(disc>0) breakdown+=`<tr><td>Discount${o.discReason?" ("+o.discReason+")":""}</td><td>-${fmt(disc)}</td></tr>`;
    if(tip>0) breakdown+=`<tr><td>Tip</td><td>+${fmt(tip)}</td></tr>`;
  }
  var split=o.splitN>1?`<p style="text-align:center;color:#7c3aed;font-weight:700;margin:8px 0">Split ${o.splitN} ways = ${fmt(o.total/o.splitN)} each</p>`:"";
  var js="window.onload=function(){window.print()}";
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:monospace;padding:20px;font-size:13px;max-width:320px;margin:0 auto}h2{color:#bf4626;margin:0 0 4px}p{margin:3px 0}table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:3px 0;border-bottom:1px dashed #ccc}.t{font-weight:700;font-size:16px;color:#bf4626;border-top:2px solid #bf4626;padding-top:6px!important}.f{text-align:center;color:#999;margin-top:16px;font-size:11px}</style></head><body><h2>La Tavola${b?" - "+b.name:""}</h2><p>${b?b.addr:""}</p><p>${b?b.phone:""}</p><hr><p><b>${o.id}</b></p><p>${o.time} | ${o.type}</p><p>${o.customer}</p>${o.takenBy?`<p>Served by ${o.takenBy}</p>`:""}${o.slot?`<p>Collect: <b>${o.slot}</b></p>`:""}<hr><table>${rows}${breakdown?'<tr><td colspan="2">&nbsp;</td></tr>'+breakdown:""}<tr class="t"><td>TOTAL</td><td>${fmt(o.total)}</td></tr></table>${split}<p style="text-align:center">${o.paid?"PAID"+(o.payMethod?" - "+o.payMethod:""):"UNPAID"}</p><div class="f">VAT No. GB 123 4567 89<br>Thank you for dining with us!<br>www.latavola.co.uk</div></body></html>`);
  var s=w.document.createElement("script");s.textContent=js;w.document.body.appendChild(s);
  w.document.close();
}

function Toasts({list,dismiss}){
  return <div style={{position:"fixed",top:64,right:10,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:300,width:"calc(100% - 20px)"}}>
    {list.map(n=><div key={n.id} className="fadeup" style={{background:"#fff",borderRadius:11,padding:"10px 12px",boxShadow:"0 4px 16px rgba(0,0,0,.12)",borderLeft:"4px solid "+(n.color||"#bf4626"),display:"flex",gap:8,alignItems:"flex-start"}}>
      <div style={{flex:1}}><p style={{fontWeight:700,fontSize:13}}>{n.title}</p><p style={{fontSize:12,color:"#8a8078"}}>{n.body}</p></div>
      <button onClick={()=>dismiss(n.id)} style={{color:"#ccc",fontSize:15,lineHeight:1}}>x</button>
    </div>)}
  </div>;
}

function Auth({onLogin,onClose,users,setUsers}){
  var [tab,setTab]=useState("in"),[em,setEm]=useState(""),[pw,setPw]=useState(""),[nm,setNm]=useState(""),[ph,setPh]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false);
  var login=async()=>{
    setErr("");setLoading(true);
    // Try staff first (hardcoded for demo)
    var staffUser=users.find(u=>u.email===em&&u.pw===pw);
    if(staffUser){onLogin(staffUser);onClose();setLoading(false);return;}
    // Try customer DB
    var r=await dbLoginCustomer(em,pw);
    if(r.error){setErr(r.error.message||"Invalid login");setLoading(false);return;}
    var u=r.data;
    onLogin({
      id:u.id,
      name:u.name,
      email:u.email,
      phone:u.phone,
      avatar:(u.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
      role:"customer",
    });
    onClose();setLoading(false);
  };
  var reg=async()=>{
    if(!nm||!em||!pw){setErr("Name, email, and password required.");return;}
    if(pw.length<6){setErr("Password must be at least 6 characters.");return;}
    setErr("");setLoading(true);
    var r=await dbRegisterCustomer(nm,em,pw,ph);
    if(r.error){setErr(r.error.message||"Registration failed");setLoading(false);return;}
    var u=r.data;
    onLogin({
      id:u.id,
      name:u.name,
      email:u.email,
      phone:u.phone,
      avatar:nm.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),
      role:"customer",
    });
    onClose();setLoading(false);
  };
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:370,padding:24}}>
      <h2 style={{fontSize:22,marginBottom:4}}>Welcome</h2>
      <p style={{color:"#8a8078",fontSize:13,marginBottom:16}}>La Tavola member portal</p>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#f7f3ee",borderRadius:9,padding:3}}>
        {[["in","Sign In"],["up","Sign Up"]].map(([k,l])=><button key={k} onClick={()=>{setTab(k);setErr("");}} style={{flex:1,padding:"9px",borderRadius:7,fontWeight:700,fontSize:13,background:tab===k?"#fff":"transparent",color:tab===k?"#1a1208":"#8a8078",border:"none",cursor:"pointer"}}>{l}</button>)}
      </div>
      {tab==="up"&&<>
        <div style={{marginBottom:9}}><label className="lbl">Full Name</label><input className="field" value={nm} onChange={e=>setNm(e.target.value)} placeholder="Alex Johnson"/></div>
        <div style={{marginBottom:9}}><label className="lbl">Phone (optional)</label><input type="tel" className="field" value={ph} onChange={e=>setPh(e.target.value)} placeholder="07700 900000"/></div>
      </>}
      <div style={{marginBottom:9}}><label className="lbl">Email</label><input type="email" className="field" value={em} onChange={e=>setEm(e.target.value)} placeholder="you@example.com"/></div>
      <div style={{marginBottom:12}}><label className="lbl">Password {tab==="up"&&<span style={{color:"#8a8078",fontWeight:400}}>(min 6 chars)</span>}</label><input type="password" className="field" value={pw} onChange={e=>setPw(e.target.value)} placeholder="password"/></div>
      {err&&<p style={{color:"#dc2626",fontSize:12,marginBottom:9,fontWeight:600,padding:"8px 10px",background:"#fee2e2",borderRadius:6}}>{EM.cross} {err}</p>}
      <button className="btn btn-r" style={{width:"100%",padding:"12px"}} disabled={loading} onClick={tab==="in"?login:reg}>{loading?"Please wait...":(tab==="in"?"Sign In":"Create Account")}</button>
      {tab==="in"&&<p style={{fontSize:10,color:"#8a8078",marginTop:8,textAlign:"center",lineHeight:1.5}}>Staff demo: marco@staff.com / staff123<br/>Or create your own customer account above</p>}
      {tab==="up"&&<p style={{fontSize:10,color:"#8a8078",marginTop:8,textAlign:"center"}}>By signing up you agree to receive order updates</p>}
    </div>
  </div>;
}

function Pay({amount,onSuccess,onClose}){
  var [step,setStep]=useState("form"),[card,setCard]=useState(""),[exp,setExp]=useState(""),[cvc,setCvc]=useState(""),[nm,setNm]=useState(""),[err,setErr]=useState("");
  var go=()=>{if(card.replace(/\s/g,"").length<16){setErr("Enter card number.");return;}if(exp.length<5){setErr("Enter expiry.");return;}if(cvc.length<3){setErr("Enter CVC.");return;}setErr("");setStep("processing");setTimeout(()=>{setStep("done");setTimeout(onSuccess,1200);},1800);};
  var fc=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  var fe=v=>{var d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+"/"+d.slice(2):d;};
  return <div onClick={step==="form"?onClose:null} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:380,padding:22}}>
      {step==="processing"&&<div style={{textAlign:"center",padding:"24px 0"}}><p style={{fontSize:16,animation:"pulse 1s infinite"}}>Processing...</p></div>}
      {step==="done"&&<div style={{textAlign:"center",padding:"24px 0"}}><p style={{fontSize:26,color:"#059669",fontWeight:700}}>Payment Successful!</p><p style={{color:"#8a8078",marginTop:6}}>{fmt(amount)} charged</p></div>}
      {step==="form"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><h3 style={{fontSize:18,marginBottom:2}}>Secure Payment</h3><p style={{color:"#8a8078",fontSize:12}}>SSL encrypted</p></div><div style={{background:"#1a1208",color:"#d4952a",borderRadius:9,padding:"6px 12px",fontWeight:700,fontSize:16}}>{fmt(amount)}</div></div>
        <div style={{background:"#1a1208",borderRadius:10,padding:"14px 16px",marginBottom:12,color:"#fff"}}><p style={{fontSize:16,letterSpacing:3,fontFamily:"monospace",marginBottom:8}}>{card||".... .... .... ...."}</p><div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.6}}><span>{nm||"CARDHOLDER"}</span><span>{exp||"MM/YY"}</span></div></div>
        <div style={{marginBottom:8}}><input className="field" value={nm} onChange={e=>setNm(e.target.value.toUpperCase())} placeholder="Name on card"/></div>
        <div style={{marginBottom:8}}><input className="field" value={card} onChange={e=>setCard(fc(e.target.value))} placeholder="Card number" maxLength={19}/></div>
        <div style={{display:"flex",gap:8,marginBottom:10}}><input className="field" value={exp} onChange={e=>setExp(fe(e.target.value))} placeholder="MM/YY" maxLength={5}/><input className="field" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,3))} placeholder="CVC"/></div>
        {err&&<p style={{color:"#dc2626",fontSize:12,marginBottom:8,fontWeight:600}}>{err}</p>}
        <button className="btn btn-r" style={{width:"100%",padding:"11px"}} onClick={go}>Pay {fmt(amount)}</button>
        <p style={{fontSize:11,color:"#8a8078",textAlign:"center",marginTop:6}}>Test: 4242 4242 4242 4242</p>
      </>}
    </div>
  </div>;
}

function BranchSel({onSelect}){
  return <div className="page" style={{maxWidth:560}}>
    <h2 style={{fontSize:26,marginBottom:4,textAlign:"center"}}>Choose Your Branch</h2>
    <p style={{color:"#8a8078",textAlign:"center",marginBottom:20,fontSize:14}}>Select a location to start ordering</p>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {BRANCHES.map(b=><button key={b.id} onClick={()=>onSelect(b)} style={{textAlign:"left",background:"#fff",borderRadius:13,padding:"15px 16px",border:"2px solid #ede8de",boxShadow:"0 2px 10px rgba(0,0,0,.06)",cursor:"pointer",width:"100%",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#bf4626"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ede8de"}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><p style={{fontWeight:700,fontSize:15,marginBottom:2}}>La Tavola - {b.name}</p><p style={{color:"#8a8078",fontSize:13,marginBottom:1}}>{b.addr}</p><p style={{color:"#8a8078",fontSize:13}}>{b.phone}</p></div><span className="bdg" style={{background:"#d1fae5",color:"#059669"}}>Open</span></div>
      </button>)}
    </div>
  </div>;
}

function MenuV({menu,user,branch,onOrder,push,discounts}){
  var cats=[...new Set(menu.filter(i=>i.avail).map(i=>i.cat))];
  var [cat,setCat]=useState(cats[0]),[cart,setCart]=useState({}),[step,setStep]=useState("menu");
  // Auto-select first category when menu data loads from DB
  useEffect(()=>{
    if(!cat&&cats.length>0)setCat(cats[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cats.length]);
  var [type,setType]=useState(()=>{
    var sess=getQrSession();
    if(sess.valid)return "eatin";
    return "delivery";
  }),[cname,setCname]=useState(user?.name||""),[table,setTable]=useState("");
  var [addr,setAddr]=useState({line1:"",postcode:"",notes:""});
  var [codeMethod,setCodeMethod]=useState("both");
  var [serviceChargeOpt,setServiceChargeOpt]=useState(true);
  var [dbCodes,setDbCodes]=useState([]);

  // Ensure type stays "eatin" while QR session is active (handles edge cases)
  useEffect(()=>{
    var sess=getQrSession();
    if(sess.valid&&type!=="eatin"){
      setType("eatin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Load promo codes from DB
  useEffect(()=>{
    dbFetchCodes().then(list=>setDbCodes(list||[]));
  },[]);
  var [postcodeData,setPostcodeData]=useState(null); // {valid, distance, fee}
  var [checkingPc,setCheckingPc]=useState(false);
  var [dbDelivery,setDbDelivery]=useState(null); // delivery settings from DB
  var [slot,setSlot]=useState(null),[code,setCode]=useState(""),[disc,setDisc]=useState(null),[derr,setDerr]=useState("");
  var [last,setLast]=useState(null),[showPay,setPay]=useState(false);

  // Auto-clear QR session if table is no longer occupied (paid/cleared by staff)
  useEffect(()=>{
    var sess=getQrSession();
    if(!sess.valid||!branch||branch.id!==sess.branch)return;
    // Check table status every 30 sec - if available, customer has left
    var checkInterval=setInterval(()=>{
      dbFetchTables().then(dbTables=>{
        var myTable=(dbTables||[]).find(t=>(t.branch_id===sess.branch)&&(String(t.table_number)===String(sess.table)||String(t.id)===String(sess.table)));
        if(myTable&&myTable.status==="available"){
          // Staff cleared this table - customer must have left
          clearQrSession();
          push({title:"Session ended",body:"Your table session has ended. Thanks for visiting!",color:"#059669"});
          setType("delivery");
        }
      }).catch(e=>{});
    },30000);
    return()=>clearInterval(checkInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[branch]);

  // Load delivery settings from DB for this branch
  useEffect(()=>{
    if(!branch)return;
    dbFetchAllDelivery().then(list=>{
      var s=(list||[]).find(x=>x.branch_id===branch.id);
      if(s){
        setDbDelivery({
          method:s.method,enabled:s.enabled,
          minOrder:parseFloat(s.min_order||0),freeOver:parseFloat(s.free_over||0),
          flatFee:parseFloat(s.flat_fee||0),maxRadius:s.max_radius||3,
          zones:s.zones||[],postcodes:s.postcodes||[],
          codEnabled:s.cod_enabled,
          codMinOrder:parseFloat(s.cod_min_order||15),
          codMaxMiles:s.cod_max_miles||3,
          serviceChargeEnabled:s.service_charge_enabled||false,
          serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
          serviceChargeMandatory:s.service_charge_mandatory||false,
          serviceChargeGroupSize:s.service_charge_group_size||6,
        });
      }
    });
  },[branch]);

  // Check UK postcode and compute distance/fee when user enters it
  var checkPostcode=async(pc)=>{
    if(!pc||pc.length<5){setPostcodeData(null);return;}
    setCheckingPc(true);
    try{
      var clean=pc.replace(/\s+/g,"").toUpperCase();
      var res=await fetch("https://api.postcodes.io/postcodes/"+clean);
      var data=await res.json();
      if(!data||data.status!==200||!data.result){setPostcodeData({valid:false,reason:"Postcode not found"});setCheckingPc(false);return;}
      var custLat=data.result.latitude,custLng=data.result.longitude;
      // Calculate distance using Haversine
      var R=3958.8; // miles
      var dLat=(custLat-branch.lat)*Math.PI/180;
      var dLng=(custLng-branch.lng)*Math.PI/180;
      var a=Math.sin(dLat/2)**2+Math.cos(branch.lat*Math.PI/180)*Math.cos(custLat*Math.PI/180)*Math.sin(dLng/2)**2;
      var c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      var miles=R*c;
      // Determine fee based on delivery method
      var d=dbDelivery;
      if(!d||!d.enabled){setPostcodeData({valid:false,reason:"Delivery not available from this branch"});setCheckingPc(false);return;}
      var fee=0,reason="",valid=true;
      if(d.method==="radius"){
        if(miles>d.maxRadius){valid=false;reason="Too far - we only deliver within "+d.maxRadius+" miles";}
        else fee=d.flatFee||0;
      }else if(d.method==="postcode"){
        var pcEntry=(d.postcodes||[]).find(p=>clean.startsWith(p.prefix.toUpperCase()));
        if(!pcEntry){valid=false;reason="We don't deliver to "+clean+" area";}
        else fee=parseFloat(pcEntry.fee)||0;
      }else if(d.method==="zone"){
        var zone=(d.zones||[]).sort((a,b)=>(+a.maxMiles)-(+b.maxMiles)).find(z=>miles<=+z.maxMiles);
        if(!zone){valid=false;reason="Too far - outside all zones";}
        else fee=parseFloat(zone.fee)||0;
      }
      // Free over threshold
      if(valid&&d.freeOver>0&&sub>=d.freeOver)fee=0;
      setPostcodeData({valid,reason,fee,miles:miles.toFixed(1),town:data.result.admin_district||data.result.admin_ward,postcode:clean});
    }catch(err){setPostcodeData({valid:false,reason:"Could not verify postcode"});}
    setCheckingPc(false);
  };
  var slots=getSlots(),busy=[slots[2],slots[5]];
  var items=Object.keys(cart).map(id=>{
    var m=menu.find(m=>String(m.id)===String(id));
    if(!m)return null;
    var typePrice=getItemPrice(m,type);
    return {...m,qty:cart[id],price:typePrice,basePrice:m.price};
  }).filter(Boolean);
  var sub=items.reduce((s,i)=>s+(+i.price||0)*i.qty,0),saving=disc?.saving||0;
  // Service charge: only on dine-in/eat-in if enabled in branch settings
  var isDineInLike=type==="dine-in"||type==="eatin";
  var serviceChargeApplies=isDineInLike&&dbDelivery&&dbDelivery.serviceChargeEnabled;
  var canRemove=serviceChargeApplies&&!dbDelivery.serviceChargeMandatory;
  var includeCharge=serviceChargeApplies&&(serviceChargeOpt||!canRemove);
  var serviceCharge=includeCharge?Math.max(0,sub-saving)*((dbDelivery.serviceChargePercent||0)/100):0;
  var total=Math.max(0,sub-saving)+serviceCharge,count=items.reduce((s,i)=>s+i.qty,0);
  var add=id=>setCart(c=>({...c,[id]:(c[id]||0)+1}));
  var rem=id=>setCart(c=>{var n={...c};n[id]>1?n[id]--:delete n[id];return n;});
  var applyCode=()=>{
    var entered=code.toUpperCase().trim();
    if(!entered){setDerr("Enter a code");setDisc(null);return;}
    // First try DB codes (admin-managed)
    var dbCode=dbCodes.find(c=>c.code&&c.code.toUpperCase()===entered);
    if(dbCode){
      // Validate DB code
      if(!dbCode.active){setDerr("This code is no longer active");setDisc(null);return;}
      if(dbCode.expires_at&&new Date(dbCode.expires_at)<new Date()){setDerr("This code has expired");setDisc(null);return;}
      if(dbCode.uses>=dbCode.max_uses){setDerr("This code has reached its usage limit");setDisc(null);return;}
      if(dbCode.min_order&&sub<dbCode.min_order){setDerr("Min order "+fmt(dbCode.min_order)+" required for this code");setDisc(null);return;}
      // First-order-only check
      if(dbCode.first_order_only&&user&&user.id){
        // Note: simple check - in production, query user's order history
      }
      // Calculate savings
      var sv=0,desc=dbCode.description||entered;
      if(dbCode.type==="percent")sv=sub*(parseFloat(dbCode.value)/100);
      else if(dbCode.type==="fixed")sv=parseFloat(dbCode.value);
      else if(dbCode.type==="free_delivery"){
        sv=0; // savings shown as 0, but we'll mark for free delivery
        desc=dbCode.description||"Free delivery";
      }
      sv=Math.min(sv,sub);
      setDisc({saving:sv,desc:desc,code:entered,freeDelivery:dbCode.type==="free_delivery"});
      setDerr("");
      return;
    }
    // Fall back to legacy hardcoded codes
    var r=applyDisc(discounts,code,sub);
    if(r.err){setDerr(r.err);setDisc(null);}
    else{setDisc(r);setDerr("");}
  };
  var finalize=paid=>{
    var sess=getQrSession();
    var qrTable=sess.valid?sess.table:null;
    var customer=type==="eatin"&&qrTable?"Table "+qrTable:(cname||"Guest");
    var phone=type==="delivery"?(table||null):null;
    var tableId=type==="eatin"&&qrTable?parseInt(qrTable):null;
    var effectiveType=type==="eatin"?"dine-in":type;
    var deliveryFee=type==="delivery"&&postcodeData?postcodeData.fee:0;
    if(disc&&disc.freeDelivery)deliveryFee=0; // Free delivery promo applied
    var finalTotal=total+deliveryFee;
    var address=type==="delivery"?{line1:addr.line1,postcode:addr.postcode,notes:addr.notes}:null;
    // Generate 4-digit delivery code for delivery orders
    var deliveryCode=type==="delivery"?String(Math.floor(1000+Math.random()*9000)):null;
    var payMethod=null;
    if(!paid){
      if(type==="delivery")payMethod="cod";
      else if(type==="collection")payMethod="cash-at-counter";
      else if(type==="eatin")payMethod="pay-at-table";
    }
    var o={
      id:uid(),
      branchId:branch?.id,
      userId:user?.id||"guest",
      customer,
      phone,
      tableId,
      address,
      items:items.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})),
      subtotal:sub,
      discount:saving,
      serviceCharge:serviceCharge,
      deliveryFee,
      total:finalTotal,
      status:"pending",
      time:nowT(),
      type:effectiveType,
      paid,
      payMethod,
      slot:type==="collection"?slot:null,
      discCode:disc?.code||null,
      source:type==="eatin"?"qr-table":"online",
      deliveryCode,
      codeMethod:type==="delivery"?codeMethod:null,
    };
    onOrder(o);
    setLast(o);
    setCart({});
    // Save order ID to localStorage so customer can find it in Track tab even as guest
    try{
      var recent=JSON.parse(localStorage.getItem("my_orders")||"[]");
      if(!recent.includes(o.id))recent.unshift(o.id);
      localStorage.setItem("my_orders",JSON.stringify(recent.slice(0,20)));
    }catch(e){}
    push({title:"Order placed!",body:o.id+" - "+(paid?"Paid online":payMethod==="cod"?"Cash on delivery":"Pay later")+" - "+fmt(finalTotal),color:paid?"#059669":"#d4952a"});
    setStep(type==="collection"?"cdone":"done");
  };

  if(step==="cdone"&&last) return <div className="page fadeup" style={{maxWidth:420,textAlign:"center"}}>
    <p style={{fontSize:48,marginBottom:12}}>{EM.bag}</p>
    <h2 style={{fontSize:24,marginBottom:5}}>Collection Confirmed!</h2>
    <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",borderRadius:12,padding:"16px 20px",margin:"16px auto",color:"#fff",display:"inline-block",minWidth:180}}><p style={{fontSize:10,opacity:.7,letterSpacing:2,marginBottom:3}}>COLLECT AT</p><p style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:700}}>{last.slot}</p></div>
    <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14}}><button className="btn btn-r" onClick={()=>{setStep("menu");setSlot(null);setDisc(null);setCode("");}}>Order Again</button><button className="btn btn-o" onClick={()=>printR(last,branch)}>Receipt</button></div>
  </div>;

  if(step==="done") return <div className="page fadeup" style={{maxWidth:430,textAlign:"center"}}>
    <p style={{fontSize:48,marginBottom:10}}>{EM.party}</p>
    <h2 style={{fontSize:24,marginBottom:4}}>Order Confirmed!</h2>
    <p style={{color:"#8a8078",marginBottom:4}}>ID: <strong>{last?.id}</strong></p>
    {last?.deliveryCode&&<div style={{background:"linear-gradient(135deg,#1e40af,#2563eb)",color:"#fff",borderRadius:14,padding:"18px 16px",margin:"14px auto",maxWidth:300}}>
      <p style={{fontSize:11,letterSpacing:2,fontWeight:700,marginBottom:6,opacity:.85}}>DELIVERY CODE</p>
      <p style={{fontSize:42,fontWeight:700,letterSpacing:8,fontFamily:"'Courier New',monospace",marginBottom:6}}>{last.deliveryCode}</p>
      <p style={{fontSize:11,opacity:.85}}>Show this code to driver on arrival</p>
    </div>}
    {last?.deliveryCode&&last?.codeMethod&&last.codeMethod!=="app"&&<p style={{fontSize:11,color:"#8a8078",marginBottom:8}}>{last.codeMethod==="sms"?"Sent by SMS":last.codeMethod==="email"?"Sent by email":"Sent by SMS and email"} (when available)</p>}
    <p style={{color:"#8a8078",fontSize:13,marginBottom:20}}>We will have it ready soon.</p>
    <button className="btn btn-r" onClick={()=>setStep("menu")}>Order Again</button>
  </div>;

  if(step==="checkout") return <>
    {showPay&&<Pay amount={total} onSuccess={()=>{setPay(false);finalize(true);}} onClose={()=>setPay(false)}/>}
    <div className="page fadeup" style={{maxWidth:500}}>
      <button className="btn btn-g" onClick={()=>setStep("menu")} style={{marginBottom:10,fontSize:13}}>Back to menu</button>
      <h2 style={{fontSize:22,marginBottom:14}}>Checkout</h2>
      <div className="card" style={{marginBottom:10}}>
        <p style={{fontWeight:700,marginBottom:9,fontSize:14}}>How would you like your order?</p>
        <div className="g3" style={{marginBottom:12}}>{[["delivery","Delivery"],["collection","Collection"],["eatin","Eat In"]].map(([tp,lb])=><button key={tp} onClick={()=>{setType(tp);setSlot(null);}} style={{padding:"12px 4px",borderRadius:9,fontWeight:700,fontSize:12,border:"2px solid "+(type===tp?"#bf4626":"#ede8de"),background:type===tp?"#fff5f3":"#fff",color:type===tp?"#bf4626":"#1a1208",cursor:"pointer"}}>{lb}</button>)}</div>
        {type==="eatin"&&<div style={{padding:"14px 16px",background:"#fffbeb",borderRadius:9,border:"2px solid #fde68a"}}>
          <p style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:5}}>{EM.cart} At the restaurant?</p>
          <p style={{fontSize:12,color:"#92400e",marginBottom:8}}>Scan the QR code on your table to order. A staff member can also take your order at the table.</p>
          {(()=>{var sess=getQrSession();if(sess.valid){return <div>
            <p style={{fontSize:13,fontWeight:700,color:"#059669",padding:"8px 10px",background:"#d1fae5",borderRadius:6,marginBottom:8}}>{EM.check} You are at Table {sess.table}. Your order will be delivered here.</p>
            <button onClick={()=>{if(window.confirm("End your table session? If you have finished eating and are leaving, this will clear your QR session."))clearQrSession();window.location.reload();}} style={{width:"100%",padding:"7px",fontSize:11,background:"#f5f0eb",color:"#8a8078",border:"1px solid #ede8de",borderRadius:6,cursor:"pointer"}}>I'm leaving the restaurant</button>
          </div>;}return <button onClick={()=>setType("collection")} style={{width:"100%",padding:"10px",background:"#bf4626",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:13}}>Switch to Collection Instead</button>;})()}
        </div>}
        {type==="delivery"&&<div style={{marginBottom:5}}>
          <div style={{marginBottom:9}}><label className="lbl">Your Name</label><input className="field" value={cname} onChange={e=>setCname(e.target.value)} placeholder="Alex Smith"/></div>
          <div style={{marginBottom:9}}><label className="lbl">Phone</label><input className="field" type="tel" value={table} onChange={e=>setTable(e.target.value)} placeholder="07700 900000"/></div>
          <div style={{marginBottom:9}}><label className="lbl">Delivery Address</label><input className="field" value={addr.line1} onChange={e=>setAddr({...addr,line1:e.target.value})} placeholder="123 Brick Lane"/></div>
          <div style={{marginBottom:9}}><label className="lbl">Postcode</label>
            <div style={{display:"flex",gap:6}}>
              <input className="field" value={addr.postcode} onChange={e=>setAddr({...addr,postcode:e.target.value.toUpperCase()})} placeholder="E1 6QL" style={{flex:1}}/>
              <button onClick={()=>checkPostcode(addr.postcode)} disabled={!addr.postcode||checkingPc} style={{padding:"9px 14px",fontSize:12,fontWeight:700,background:"#1a1208",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>{checkingPc?"Checking...":"Check"}</button>
            </div>
          </div>
          <div style={{marginBottom:9}}><label className="lbl">Delivery notes (optional)</label><input className="field" value={addr.notes} onChange={e=>setAddr({...addr,notes:e.target.value})} placeholder="Ring bell, flat 2..."/></div>
          {postcodeData&&postcodeData.valid&&<div style={{padding:"10px 12px",background:"#d1fae5",borderRadius:7,fontSize:12,color:"#065f46",marginBottom:9}}>
            <strong>{EM.check} We deliver here!</strong><br/>
            {postcodeData.miles} miles - {postcodeData.fee>0?"Delivery fee "+fmt(postcodeData.fee):"FREE delivery"}
            {postcodeData.town&&<><br/>Area: {postcodeData.town}</>}
          </div>}
          {postcodeData&&!postcodeData.valid&&<div style={{padding:"10px 12px",background:"#fee2e2",borderRadius:7,fontSize:12,color:"#991b1b",marginBottom:9}}>
            <strong>{EM.cross}</strong> {postcodeData.reason}
          </div>}
          {dbDelivery&&dbDelivery.minOrder&&sub<dbDelivery.minOrder&&<div style={{padding:"9px 11px",background:"#fffbeb",borderRadius:7,fontSize:12,color:"#92400e",marginBottom:9}}>
            Minimum order for delivery: {fmt(dbDelivery.minOrder)} - add {fmt(dbDelivery.minOrder-sub)} more
          </div>}
          <div style={{padding:"10px 12px",background:"#eff6ff",borderRadius:7,marginBottom:9}}>
            <p style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:6}}>How to receive delivery code?</p>
            <p style={{fontSize:10,color:"#1e3a8a",marginBottom:7}}>4-digit code to give the driver - proves correct delivery</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5}}>
              {[["sms","Text (SMS)"],["email","Email"],["both","Both"],["app","Show in app only"]].map(([k,l])=><button key={k} onClick={()=>setCodeMethod(k)} style={{padding:"8px 4px",fontSize:11,fontWeight:700,background:codeMethod===k?"#2563eb":"#fff",color:codeMethod===k?"#fff":"#1e3a8a",border:"2px solid "+(codeMethod===k?"#2563eb":"#bfdbfe"),borderRadius:6,cursor:"pointer"}}>{l}</button>)}
            </div>
          </div>
        </div>}
        {type==="collection"&&<div><div style={{marginBottom:9}}><label className="lbl">Your Name</label><input className="field" value={cname} onChange={e=>setCname(e.target.value)} placeholder="Alex Smith"/></div><label className="lbl">Collection Time</label><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginTop:4}}>{slots.map(s=><button key={s} disabled={busy.includes(s)} onClick={()=>setSlot(s)} style={{padding:"8px 4px",borderRadius:7,fontWeight:700,fontSize:12,border:"2px solid "+(slot===s?"#7c3aed":"#ede8de"),background:slot===s?"#f5f0ff":"#fff",color:slot===s?"#7c3aed":busy.includes(s)?"#ccc":"#1a1208",opacity:busy.includes(s)?.4:1,cursor:busy.includes(s)?"not-allowed":"pointer"}}>{s}</button>)}</div></div>}
      </div>
      <div className="card" style={{marginBottom:10}}>
        <p style={{fontWeight:700,marginBottom:9,fontSize:14}}>Order Summary</p>
        {items.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #ede8de",fontSize:13}}><span>{i.name} x{i.qty}</span><span style={{fontWeight:600}}>{fmt(i.price*i.qty)}</span></div>)}
        <div style={{marginTop:9}}><div style={{display:"flex",gap:7,marginBottom:4}}><input className="field" value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setDerr("");setDisc(null);}} placeholder="Discount code" style={{flex:1}}/><button className="btn btn-o" onClick={applyCode} style={{padding:"0 12px",flexShrink:0}}>Apply</button></div>{derr&&<p style={{fontSize:11,color:"#dc2626",fontWeight:600}}>{derr}</p>}{disc&&<p style={{fontSize:11,color:"#059669",fontWeight:600}}>Applied: {disc.desc} - saving {fmt(disc.saving)}</p>}</div>
        <div className="hr"/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#8a8078",marginBottom:3}}><span>Subtotal</span><span>{fmt(sub)}</span></div>
        {saving>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#059669",marginBottom:3}}><span>Discount</span><span>- {fmt(saving)}</span></div>}
        {serviceChargeApplies&&includeCharge&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#7c3aed",marginBottom:3,alignItems:"center"}}>
          <span>Service charge ({dbDelivery.serviceChargePercent}%){canRemove&&<button onClick={()=>setServiceChargeOpt(false)} style={{marginLeft:6,fontSize:10,color:"#dc2626",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Remove</button>}</span>
          <span>+ {fmt(serviceCharge)}</span>
        </div>}
        {serviceChargeApplies&&!includeCharge&&canRemove&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8a8078",marginBottom:3}}>
          <span>Service charge removed</span>
          <button onClick={()=>setServiceChargeOpt(true)} style={{fontSize:10,color:"#7c3aed",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Add back</button>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:16}}><span>Total</span><span style={{color:"#bf4626"}}>{fmt(total)}</span></div>
      </div>
      {(()=>{
        var sess=getQrSession();
        var qrTable=sess.valid?sess.table:null;
        var isEatInAtTable=type==="eatin"&&qrTable;
        if(type==="eatin"&&!qrTable){
          return <div style={{padding:"14px",background:"#fef3c7",borderRadius:9,textAlign:"center",fontSize:13,color:"#92400e",fontWeight:600}}>Please scan the QR code at your table, or switch to Delivery/Collection above.</div>;
        }
        if(type==="delivery"){
          if(!cname||!table){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Enter name and phone to continue</button>;}
          if(!addr.line1||!addr.postcode){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Enter delivery address and postcode</button>;}
          if(!postcodeData){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Click "Check" to verify postcode</button>;}
          if(!postcodeData.valid){return <div style={{padding:"12px",background:"#fee2e2",color:"#991b1b",borderRadius:8,textAlign:"center",fontWeight:700}}>{postcodeData.reason}</div>;}
          if(dbDelivery&&dbDelivery.minOrder&&sub<dbDelivery.minOrder){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Minimum {fmt(dbDelivery.minOrder)} required</button>;}
          // Check COD using DB settings
          var codOk=false,codReason="Cash on delivery not accepted";
          if(dbDelivery&&dbDelivery.codEnabled){
            if(total<dbDelivery.codMinOrder){codReason="Min "+fmt(dbDelivery.codMinOrder)+" for cash on delivery";}
            else if(postcodeData.miles&&parseFloat(postcodeData.miles)>dbDelivery.codMaxMiles){codReason="COD only within "+dbDelivery.codMaxMiles+" miles";}
            else codOk=true;
          }
          var actualFee=disc&&disc.freeDelivery?0:(postcodeData.fee||0);
          var finalTotal=total+actualFee;
          return <div>
            <div style={{padding:"10px 12px",background:"#fafaf5",borderRadius:7,marginBottom:9,fontSize:13}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Subtotal</span><span>{fmt(total)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Delivery{disc&&disc.freeDelivery?" (Promo)":""}</span><span style={{color:actualFee===0?"#059669":"#1a1208",fontWeight:700}}>{actualFee===0?"FREE":fmt(actualFee)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,marginTop:4,paddingTop:4,borderTop:"1px solid #ede8de"}}><span>Total</span><span style={{color:"#bf4626"}}>{fmt(finalTotal)}</span></div>
            </div>
            <button className="btn btn-r" onClick={()=>setPay(true)} style={{width:"100%",padding:"12px",fontSize:14,marginBottom:7}}>{EM.star} Pay Online - {fmt(finalTotal)}</button>
            {codOk?<button className="btn btn-o" onClick={()=>finalize(false)} style={{width:"100%",padding:"12px",fontSize:13}}>{EM.pound} Cash on Delivery - {fmt(finalTotal)}</button>:<div style={{padding:"9px 11px",background:"#f5f0eb",borderRadius:7,fontSize:11,color:"#8a8078",textAlign:"center"}}>{EM.pound} Cash on Delivery: {codReason}</div>}
          </div>;
        }
        if(type==="collection"){
          if(!cname){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Enter your name to continue</button>;}
          if(!slot){return <button disabled style={{width:"100%",padding:"12px",background:"#ccc",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"not-allowed"}}>Select a collection time</button>;}
          return <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={()=>setPay(true)} style={{flex:1,padding:"12px"}}>Pay Online - {fmt(total)}</button><button className="btn btn-o" onClick={()=>finalize(false)} style={{flex:1,padding:"12px"}}>Pay at Collection</button></div>;
        }
        if(isEatInAtTable){
          return <div style={{display:"flex",gap:8}}><button className="btn btn-r" onClick={()=>setPay(true)} style={{flex:1,padding:"12px"}}>Pay Now - {fmt(total)}</button><button className="btn btn-o" onClick={()=>finalize(false)} style={{flex:1,padding:"12px"}}>Ask Staff for Bill</button></div>;
        }
        return null;
      })()}
    </div>
  </>;

  return <div className="page">
    {(()=>{var sess=getQrSession();if(!sess.valid)return null;return <div style={{background:"linear-gradient(135deg,#d1fae5,#a7f3d0)",border:"2px solid #059669",borderRadius:12,padding:"11px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
      <div>
        <p style={{fontSize:13,fontWeight:700,color:"#065f46",marginBottom:2}}>{EM.check} Seated at Table {sess.table}</p>
        <p style={{fontSize:11,color:"#047857"}}>Dine-in prices apply - your order comes to your table</p>
      </div>
      <button onClick={()=>{if(window.confirm("End your table session? Only click this if you have finished eating and are leaving the restaurant."))clearQrSession();window.location.reload();}} style={{padding:"7px 12px",fontSize:11,background:"#fff",color:"#065f46",border:"1px solid #059669",borderRadius:7,cursor:"pointer",fontWeight:700}}>End Session / Leaving</button>
    </div>;})()}
    <div style={{background:"linear-gradient(135deg,#1a1208,#2e1f10)",borderRadius:16,padding:"22px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 50%,rgba(212,149,42,.12),transparent 70%)"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <p style={{color:"#d4952a",fontSize:10,letterSpacing:3,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Welcome to</p>
        <h1 style={{color:"#fff",fontSize:30,marginBottom:4}}>La Tavola</h1>
        {branch&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:6,flexWrap:"wrap"}}>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:13}}>{EM.pin} {branch.addr}</p>
          <button onClick={()=>{if(window.confirm("Change branch? Your cart will be cleared."))window.location.href="/";}} style={{padding:"5px 11px",fontSize:11,background:"rgba(212,149,42,.2)",color:"#d4952a",border:"1px solid rgba(212,149,42,.4)",borderRadius:6,cursor:"pointer",fontWeight:700}}>Change Branch</button>
        </div>}
        {user&&<p style={{color:"#d4952a",fontSize:13,marginTop:6}}>{EM.wave} Hello, {user.name.split(" ")[0]}!</p>}
      </div>
    </div>
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:12}}>
      {cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap",padding:"7px 14px",borderRadius:50,fontWeight:600,fontSize:12,border:"2px solid "+(cat===c?"#bf4626":"#ede8de"),background:cat===c?"#bf4626":"#fff",color:cat===c?"#fff":"#1a1208",flexShrink:0,cursor:"pointer",transition:"all .18s"}}>{c}</button>)}
    </div>
    <div className="ag" style={{marginBottom:88}}>
      {(()=>{var seen=new Set();return menu.filter(i=>i.cat===cat&&i.avail&&isItemAvailable(i,type)).filter(i=>{var key=(i.name||"").toLowerCase().trim()+"|"+(i.cat||"");if(seen.has(key))return false;seen.add(key);return true;}).map(item=>{var displayPrice=getItemPrice(item,type);return <div key={item.dbId||item.id} className="card" style={{display:"flex",flexDirection:"column",gap:7,opacity:item.stock===0?.5:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <span style={{fontSize:32,lineHeight:1}}>{EM[item.icon]||""}</span>
          <div>{item.stock>0&&item.stock<=5&&<span className="bdg" style={{background:"#fef3c7",color:"#d97706",fontSize:10}}>Low stock</span>}{item.stock===0&&<span className="bdg" style={{background:"#fee2e2",color:"#dc2626",fontSize:10}}>Sold out</span>}</div>
        </div>
        <h3 style={{fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:700}}>{item.name}</h3>
        <p style={{fontSize:12,color:"#8a8078",lineHeight:1.5,flex:1}}>{item.desc}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:15,fontWeight:700,color:"#bf4626"}}>{fmt(displayPrice)}</span>
          {item.stock>0&&(cart[item.id]?<div style={{display:"flex",alignItems:"center",gap:8,background:"#f7f3ee",borderRadius:50,padding:"3px 12px",border:"1px solid #ede8de"}}><button onClick={()=>rem(item.id)} style={{fontWeight:700,fontSize:20,color:"#bf4626",lineHeight:1,border:"none",background:"none",cursor:"pointer"}}>-</button><span style={{fontWeight:700,minWidth:14,textAlign:"center"}}>{cart[item.id]}</span><button onClick={()=>add(item.id)} style={{fontWeight:700,fontSize:20,color:"#bf4626",lineHeight:1,border:"none",background:"none",cursor:"pointer"}}>+</button></div>:<button onClick={()=>add(item.id)} style={{background:"#1a1208",color:"#fff",borderRadius:"50%",width:32,height:32,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background="#bf4626"} onMouseLeave={e=>e.currentTarget.style.background="#1a1208"}>+</button>)}
        </div>
      </div>;});})()}
    </div>
    {count>0&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:300}}>
      <button className="btn btn-d" onClick={()=>setStep("checkout")} style={{padding:"12px 24px",borderRadius:50,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,.3)",gap:8,minWidth:190}}>
        <span style={{background:"#bf4626",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{count}</span>
        <span style={{flex:1,textAlign:"center"}}>View Cart</span>
        <span style={{color:"#d4952a",fontWeight:700}}>{fmt(total)}</span>
      </button>
    </div>}
  </div>;
}

function TrackV({orders,branches,user}){
  var [q,setQ]=useState(""),[found,setFound]=useState(null),[tried,setTried]=useState(false);
  // Auto-update displayed order as orders prop changes (real-time status sync)
  useEffect(()=>{
    if(found&&orders){
      var updated=orders.find(o=>o.id===found.id);
      if(updated)setFound(updated);
    }
  },[orders,found]);
  var search=()=>{
    var ord=orders.find(o=>o.id.toLowerCase()===q.trim().toLowerCase())||null;
    setFound(ord);
    setTried(true);
    // Save searched order ID to recent list so it persists
    if(ord){
      try{
        var recent=JSON.parse(localStorage.getItem("my_orders")||"[]");
        if(!recent.includes(ord.id))recent.unshift(ord.id);
        localStorage.setItem("my_orders",JSON.stringify(recent.slice(0,20)));
      }catch(e){}
    }
  };

  // Get recent order IDs from localStorage (works for guest QR orders too)
  var [recentIds,setRecentIds]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("my_orders")||"[]");}catch(e){return [];}
  });
  // Re-check localStorage on mount + when orders change (in case order placed in another tab)
  useEffect(()=>{
    try{setRecentIds(JSON.parse(localStorage.getItem("my_orders")||"[]"));}catch(e){}
  },[orders]);

  // Filter active orders to ONLY this user's orders (privacy)
  var myActiveOrders=orders.filter(o=>{
    if(!["pending","preparing","ready"].includes(o.status))return false;
    // Match logged-in user
    if(user){
      if(user.id&&o.userId===user.id)return true;
      if(user.phone&&o.phone===user.phone)return true;
    }
    // Match recent order IDs from localStorage (works for guest users)
    if(recentIds.includes(o.id))return true;
    return false;
  });
  var fb=found?branches.find(b=>b.id===found.branchId):null;
  var stepsN=["pending","preparing","ready","delivered"],stepsC=["pending","preparing","ready","collected"];
  var steps=found?.type==="collection"?stepsC:stepsN,si=found?steps.indexOf(found.status):-1;
  var pct=si<0?0:Math.round((si/(steps.length-1))*100);
  return <div className="page" style={{maxWidth:500}}>
    <h2 style={{fontSize:24,marginBottom:4}}>Track Your Order</h2>
    <p style={{color:"#8a8078",fontSize:13,marginBottom:16}}>Enter your order ID</p>
    <div style={{display:"flex",gap:8,marginBottom:18}}><input className="field" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. ORD-12345" style={{flex:1}}/><button className="btn btn-r" onClick={search}>Search</button></div>
    {tried&&!found&&<div className="card" style={{textAlign:"center",padding:20}}><p style={{fontWeight:700}}>Order not found</p></div>}
    {found&&<div className="card fadeup" style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div><p style={{fontWeight:700,fontSize:15}}>{found.id}</p><p style={{color:"#8a8078",fontSize:12}}>{found.customer} - {found.time} - {found.type}</p></div>
        <div style={{textAlign:"right"}}><span className="bdg" style={{background:SB[found.status],color:SC[found.status]}}>{SL[found.status]}</span>{found.slot&&<div style={{background:"#f5f0ff",borderRadius:7,padding:"5px 10px",marginTop:4}}><p style={{fontSize:9,color:"#7c3aed",fontWeight:700}}>COLLECT AT</p><p style={{fontSize:18,fontWeight:700,color:"#7c3aed"}}>{found.slot}</p></div>}</div>
      </div>
      <div style={{background:"#1a1208",borderRadius:10,padding:14,marginBottom:12,color:"#fff"}}>
        <div style={{height:3,background:"rgba(255,255,255,.1)",borderRadius:2,overflow:"hidden",marginBottom:10}}><div style={{height:"100%",background:"#4ade80",width:pct+"%",borderRadius:2,transition:"width .8s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between"}}>{steps.map((s,i)=><div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1}}><div style={{width:18,height:18,borderRadius:"50%",background:i<=si?"#4ade80":"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{i<=si?"v":""}</div><span style={{fontSize:8,color:i<=si?"#4ade80":"#555",textAlign:"center",fontWeight:600}}>{SL[s]}</span></div>)}</div>
      </div>
      {found.items.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #ede8de",fontSize:13}}><span>{it.name} x{it.qty}</span><span style={{fontWeight:600}}>{fmt(it.price*it.qty)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontWeight:700,fontSize:15}}><span>Total</span><span style={{color:"#bf4626"}}>{fmt(found.total)}</span></div>
      <button onClick={()=>printR(found,fb)} className="btn btn-o" style={{width:"100%",marginTop:9,padding:"8px",fontSize:13}}>Print Receipt</button>
    </div>}
    <h3 style={{fontSize:16,marginBottom:9}}>Your Active Orders</h3>
    {!user&&myActiveOrders.length===0&&<div className="card" style={{padding:14,textAlign:"center",background:"#fffbeb",borderLeft:"4px solid #d97706"}}>
      <p style={{fontSize:12,color:"#92400e",marginBottom:6}}>{EM.star} Sign in to see all your orders</p>
      <p style={{fontSize:11,color:"#92400e"}}>Or enter your order ID above to track</p>
    </div>}
    {user&&myActiveOrders.length===0&&<div className="card" style={{padding:14,textAlign:"center"}}>
      <p style={{fontSize:13,color:"#8a8078"}}>You have no active orders right now</p>
    </div>}
    {myActiveOrders.map(o=><button key={o.id} onClick={()=>{setQ(o.id);setFound(o);setTried(true);}} style={{width:"100%",textAlign:"left",background:"#fff",borderRadius:9,padding:"10px 12px",marginBottom:6,boxShadow:"0 2px 8px rgba(0,0,0,.06)",border:"1px solid #ede8de",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateX(4px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}><div><p style={{fontWeight:700,fontSize:13}}>{o.id}</p><p style={{color:"#8a8078",fontSize:11}}>{o.customer} - {o.time}</p></div><span className="bdg" style={{background:SB[o.status],color:SC[o.status]}}>{SL[o.status]}</span></button>)}
  </div>;
}

function BookV({reservations,setReservations,user,onAuth,branches,push}){
  var [step,setStep]=useState("form");
  var [form,setF]=useState({name:user?.name||"",email:user?.email||"",phone:"",date:"",time:"",guests:"2",branchId:"b1",notes:""});
  var [conf,setConf]=useState(null);
  var [hours,setHours]=useState([]);
  var [branchTables,setBranchTables]=useState([]);
  var [slotsLoading,setSlotsLoading]=useState(false);
  var [availSlots,setAvailSlots]=useState([]);
  var today=new Date().toISOString().split("T")[0];

  // Load hours + tables when branch changes
  useEffect(()=>{
    if(!form.branchId)return;
    dbFetchHours(form.branchId).then(h=>setHours(h||[]));
    dbFetchTables(form.branchId).then(t=>setBranchTables(t||[]));
  },[form.branchId]);

  // Generate slots whenever date/guests/branch changes
  useEffect(()=>{
    if(!form.date||!form.branchId){setAvailSlots([]);return;}
    setSlotsLoading(true);
    var slots=[];
    var d=new Date(form.date+"T00:00:00");
    var dow=d.getDay();
    var todayHours=hours.find(h=>h.day_of_week===dow);
    if(!todayHours||todayHours.is_closed){setAvailSlots([]);setSlotsLoading(false);return;}
    // Generate 30-min slots from open to close-90min
    var toMin=t=>{var p=t.split(":");return +p[0]*60+(+p[1]);};
    var toStr=m=>{var h=Math.floor(m/60),mm=m%60;return(h<10?"0":"")+h+":"+(mm<10?"0":"")+mm;};
    var openM=toMin(todayHours.open_time);
    var closeM=toMin(todayHours.close_time);
    if(closeM<openM)closeM+=24*60; // past midnight
    // Last booking 90min before close
    for(var m=openM;m<=closeM-90;m+=30){slots.push(toStr(m%(24*60)));}
    // Fetch existing bookings for that date and filter out full slots
    dbFetchReservations(form.branchId,form.date,form.date).then(existingRes=>{
      var party=parseInt(form.guests)||2;
      // For each slot, check if there are enough tables that fit party
      var validSlots=slots.filter(slot=>{
        // Count tables that fit party size
        var fitsTables=branchTables.filter(t=>t.seats>=party);
        if(fitsTables.length===0)return false;
        // Count existing bookings at this slot (within 90min window)
        var slotM=toMin(slot);
        var booked=(existingRes||[]).filter(r=>{
          if(r.status==="cancelled")return false;
          var rM=toMin(r.reservation_time.slice(0,5));
          return Math.abs(rM-slotM)<90;
        });
        // If booked count >= tables that fit, slot is full
        return booked.length<fitsTables.length;
      });
      setAvailSlots(validSlots);
      setSlotsLoading(false);
    });
  },[form.date,form.branchId,form.guests,hours,branchTables]);

  var submit=()=>{
    if(!form.name||!form.email||!form.date||!form.time)return;
    var r={...form,id:rid(),guests:+form.guests,status:"confirmed",userId:user?.id||null};
    setReservations(rs=>[r,...rs]);
    setConf(r);
    setStep("done");
    // Save to database with detailed error handling
    dbSaveReservation(r).then(result=>{
      if(result.error){
        console.error("RESERVATION SAVE ERROR:",result.error);
        push&&push({title:"DB error: "+result.error.message,body:"Check console for details",color:"#dc2626"});
      }else if(result.data){
        console.log("RESERVATION SAVED:",result.data);
        push&&push({title:"Saved to database",body:"ID: "+result.data.id,color:"#059669"});
      }
    }).catch(err=>{
      console.error("RESERVATION EXCEPTION:",err);
      push&&push({title:"Exception: "+err.message,body:"Check console",color:"#dc2626"});
    });
  };

  var dayHours=form.date?hours.find(h=>h.day_of_week===new Date(form.date+"T00:00:00").getDay()):null;

  if(step==="done"&&conf) return <div className="page fadeup" style={{maxWidth:420,textAlign:"center"}}>
    <p style={{fontSize:48,marginBottom:10}}>{EM.party}</p>
    <h2 style={{fontSize:24,marginBottom:5}}>Reservation Confirmed!</h2>
    <p style={{color:"#8a8078",fontSize:13,marginBottom:14}}>We look forward to seeing you</p>
    <div className="card" style={{textAlign:"left",marginBottom:14}}>{[["Branch",(branches.find(b=>b.id===conf.branchId)||{}).name],["Date",conf.date],["Time",conf.time],["Guests",conf.guests+" people"],["Name",conf.name]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #ede8de",fontSize:13}}><span style={{color:"#8a8078"}}>{k}</span><span style={{fontWeight:700}}>{v}</span></div>)}</div>
    <button className="btn btn-r" onClick={()=>{setStep("form");setConf(null);setF({name:user?.name||"",email:user?.email||"",phone:"",date:"",time:"",guests:"2",branchId:"b1",notes:""});}}>Book Again</button>
  </div>;

  return <div className="page" style={{maxWidth:520}}>
    <h2 style={{fontSize:24,marginBottom:4}}>Book a Table</h2>
    <p style={{color:"#8a8078",fontSize:13,marginBottom:18}}>Reserve your spot at La Tavola</p>
    <div className="card" style={{marginBottom:10}}>
      <p style={{fontWeight:700,marginBottom:9,fontSize:14}}>Choose Branch</p>
      {branches.map(b=><button key={b.id} onClick={()=>setF(f=>({...f,branchId:b.id,time:""}))} style={{width:"100%",textAlign:"left",padding:"9px 11px",borderRadius:8,border:"2px solid "+(form.branchId===b.id?"#bf4626":"#ede8de"),background:form.branchId===b.id?"#fff5f3":"#fff",marginBottom:5,cursor:"pointer"}}><p style={{fontWeight:700,fontSize:13}}>{b.name}</p><p style={{color:"#8a8078",fontSize:11}}>{b.addr}</p></button>)}
    </div>
    <div className="card" style={{marginBottom:10}}>
      <div className="g2" style={{marginBottom:9}}>
        <div><label className="lbl">Date</label><input type="date" className="field" value={form.date} min={today} onChange={e=>setF(f=>({...f,date:e.target.value,time:""}))}/></div>
        <div><label className="lbl">Guests</label><select className="field" value={form.guests} onChange={e=>setF(f=>({...f,guests:e.target.value,time:""}))}>{[1,2,3,4,5,6,7,8,10,12].map(n=><option key={n}>{n}</option>)}</select></div>
      </div>
      {form.date&&dayHours&&dayHours.is_closed&&<div style={{padding:"11px 14px",background:"#fee2e2",borderRadius:8,marginBottom:9,fontSize:13,color:"#991b1b",fontWeight:600}}>Sorry, this branch is closed on {new Date(form.date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long"})}s. Please pick another day.</div>}
      {form.date&&dayHours&&!dayHours.is_closed&&<div style={{padding:"9px 12px",background:"#f0fdf4",borderRadius:8,marginBottom:9,fontSize:12,color:"#065f46"}}><strong>Open {dayHours.open_time?.slice(0,5)} - {dayHours.close_time?.slice(0,5)}</strong> on selected day</div>}
      {form.date&&!slotsLoading&&availSlots.length===0&&dayHours&&!dayHours.is_closed&&<div style={{padding:"11px 14px",background:"#fffbeb",borderRadius:8,marginBottom:9,fontSize:13,color:"#92400e"}}>{EM.cross} No tables available for {form.guests} guests on this date. Try a different date or smaller party size.</div>}
      {form.date&&slotsLoading&&<p style={{fontSize:12,color:"#8a8078",textAlign:"center",padding:10}}>Checking availability...</p>}
      {availSlots.length>0&&<>
        <label className="lbl">Available Times</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:9}}>
          {availSlots.map(tm=><button key={tm} onClick={()=>setF(f=>({...f,time:tm}))} style={{padding:"9px 4px",borderRadius:7,fontWeight:700,fontSize:12,border:"2px solid "+(form.time===tm?"#bf4626":"#ede8de"),background:form.time===tm?"#fff5f3":"#fff",color:form.time===tm?"#bf4626":"#1a1208",cursor:"pointer"}}>{tm}</button>)}
        </div>
      </>}
      <div style={{marginBottom:7}}><label className="lbl">Name</label><input className="field" value={form.name} onChange={e=>setF(f=>({...f,name:e.target.value}))} placeholder="Alex Johnson"/></div>
      <div style={{marginBottom:7}}><label className="lbl">Email</label><input className="field" type="email" value={form.email} onChange={e=>setF(f=>({...f,email:e.target.value}))} placeholder="alex@example.com"/></div>
      <div style={{marginBottom:7}}><label className="lbl">Phone</label><input className="field" type="tel" value={form.phone} onChange={e=>setF(f=>({...f,phone:e.target.value}))} placeholder="07700 900000"/></div>
      <div><label className="lbl">Special Requests</label><textarea className="field" value={form.notes} onChange={e=>setF(f=>({...f,notes:e.target.value}))} rows={2} style={{resize:"vertical"}} placeholder="Window table, birthday..."/></div>
    </div>
    <button className="btn btn-r" disabled={!form.name||!form.email||!form.date||!form.time} onClick={submit} style={{width:"100%",padding:"12px"}}>Confirm Reservation</button>
  </div>;
}


function ReviewsV({reviews,setReviews,user,onAuth}){
  var [show,setShow]=useState(false),[rat,setRat]=useState(5),[com,setCom]=useState("");
  var avg=reviews.length?(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1):"N/A";
  var stars=(n,sz=14)=>Array.from({length:5}).map((_,i)=><span key={i} style={{color:i<n?"#d4952a":"#ddd",fontSize:sz}}>*</span>);
  var submit=()=>{if(!com.trim())return;var newR={id:"r"+Date.now(),userId:user?.id,name:user?.name||"Guest",rating:rat,comment:com,date:"Just now",helpful:0};setReviews(rs=>[newR,...rs]);dbSubmitReview({customer:newR.name,rating:newR.rating,comment:newR.comment}).catch(e=>console.log("Review DB save:",e));setShow(false);setCom("");setRat(5);};
  return <div className="page" style={{maxWidth:600}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:24,marginBottom:4}}>Reviews</h2><div style={{display:"flex",alignItems:"center",gap:7}}>{stars(Math.round(parseFloat(avg)||0))}<span style={{fontWeight:700,fontSize:17}}>{avg}</span><span style={{color:"#8a8078",fontSize:13}}>({reviews.length})</span></div></div>
      {user?<button className="btn btn-r" onClick={()=>setShow(s=>!s)} style={{padding:"8px 16px"}}>Write a Review</button>:<button className="btn btn-o" onClick={onAuth} style={{padding:"8px 16px"}}>Sign in to review</button>}
    </div>
    {show&&<div className="card fadeup" style={{marginBottom:12,border:"2px solid #bf4626"}}>
      <h3 style={{fontSize:16,marginBottom:10}}>Your Review</h3>
      <div style={{marginBottom:9}}><label className="lbl">Rating</label><div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setRat(i)} style={{fontSize:26,color:i<=rat?"#d4952a":"#ddd",border:"none",background:"none",cursor:"pointer"}}>*</button>)}</div></div>
      <div style={{marginBottom:10}}><label className="lbl">Comment</label><textarea className="field" value={com} onChange={e=>setCom(e.target.value)} rows={3} style={{resize:"vertical"}} placeholder="Tell us about your experience..."/></div>
      <div style={{display:"flex",gap:8}}><button className="btn btn-r" onClick={submit} style={{flex:1}}>Submit</button><button className="btn btn-o" onClick={()=>setShow(false)} style={{flex:1}}>Cancel</button></div>
    </div>}
    {reviews.map(r=><div key={r.id} className="card fadeup" style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{background:"#bf4626",color:"#fff",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11}}>{r.name.slice(0,2).toUpperCase()}</div><div><p style={{fontWeight:700,fontSize:13}}>{r.name}</p><p style={{color:"#8a8078",fontSize:11}}>{r.date}</p></div></div><div>{stars(r.rating)}</div></div>
      <p style={{fontSize:13,lineHeight:1.6,marginBottom:6}}>{r.comment}</p>
      <button onClick={()=>setReviews(rs=>rs.map(x=>x.id===r.id?{...x,helpful:x.helpful+1}:x))} style={{fontSize:11,color:"#8a8078",border:"none",background:"none",cursor:"pointer"}}>Helpful ({r.helpful})</button>
    </div>)}
  </div>;
}

function AccountV({user,orders,reviews,reservations,onAuth,branches}){
  var [tab,setTab]=useState("orders");
  var [diet,setDiet]=useState([]);
  var [loyaltyData,setLoyaltyData]=useState({points:0,tier:"bronze"});
  var [loyaltyHistory,setLoyaltyHistory]=useState([]);

  // Load dietary prefs + loyalty data when user logs in
  useEffect(()=>{
    if(!user||!user.id)return;
    dbFetchPrefs(user.id).then(p=>setDiet(p||[]));
    dbFetchLoyalty(user.id).then(d=>{
      setLoyaltyData({points:d.loyalty_points||0,tier:d.loyalty_tier||"bronze"});
    });
    dbLoyaltyHistory(user.id).then(h=>setLoyaltyHistory(h||[]));
  },[user]);

  var toggleDiet=(id)=>{
    var newDiet=diet.includes(id)?diet.filter(x=>x!==id):[...diet,id];
    setDiet(newDiet);
    if(user&&user.id)dbSavePrefs(user.id,newDiet);
  };

  if(!user) return <div className="page" style={{maxWidth:360,textAlign:"center",paddingTop:50}}>
    <p style={{fontSize:48,marginBottom:10}}>{EM.person}</p>
    <h2 style={{fontSize:24,marginBottom:6}}>Your Account</h2>
    <p style={{color:"#8a8078",marginBottom:18,fontSize:13}}>Sign in to view orders and loyalty points.</p>
    <button className="btn btn-r" onClick={onAuth} style={{padding:"11px 28px"}}>Sign In</button>
  </div>;
  var mine=orders.filter(o=>o.userId===user.id),spent=mine.filter(o=>o.paid).reduce((s,o)=>s+o.total,0);
  // Use DB loyalty points if available, otherwise calculate
  var pts=loyaltyData.points>0?loyaltyData.points:Math.floor(spent*10);
  var tier=getTier(pts),next=TIERS.find(t=>t.min>pts),prog=next?Math.round(((pts-tier.min)/(next.min-tier.min))*100):100;
  return <div className="page" style={{maxWidth:600}}>
    <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",borderRadius:16,padding:"18px 20px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
      <div className="av" style={{width:50,height:50,fontSize:18}}>{user.avatar}</div>
      <div style={{flex:1}}><h2 style={{fontSize:18,color:"#fff",marginBottom:1}}>{user.name}</h2><p style={{color:"rgba(255,255,255,.5)",fontSize:12}}>{user.email}</p></div>
      <div style={{textAlign:"center"}}><span className="bdg" style={{background:tier.bg,color:tier.color,fontSize:12}}>{tier.name}</span><p style={{color:"#d4952a",fontSize:17,fontWeight:700,marginTop:3}}>{pts.toLocaleString()} pts</p></div>
    </div>
    <div className="card" style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontWeight:700,fontSize:14}}>Loyalty Points</p><span className="bdg" style={{background:tier.bg,color:tier.color}}>{tier.name}</span></div>
      {next&&<><div className="lbar" style={{marginBottom:5}}><div className="lfill" style={{width:prog+"%",background:tier.color}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a8078"}}><span>{pts} pts</span><span>{next.min-pts} pts to {next.name}</span></div></>}
      <p style={{fontSize:11,color:"#8a8078",marginTop:8}}>Earn 10 points per {EM.pound}1 spent. Redeem 100 points for {EM.pound}1 off any order.</p>
    </div>
    <div className="g3" style={{marginBottom:12}}>{[["Orders",mine.length,"#bf4626"],["Spent",fmt(spent),"#059669"],["Points",pts.toLocaleString(),"#d4952a"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid #ede8de"}}><div style={{fontWeight:700,fontSize:17,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600,textTransform:"uppercase"}}>{l}</div></div>)}</div>
    <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:2}}>{[["orders","Orders"],["reviews","Reviews"],["book","Bookings"],["dietary","Dietary"],["loyalty","Loyalty"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"6px 14px",borderRadius:8,fontWeight:600,fontSize:12,border:"2px solid",borderColor:tab===k?"#1a1208":"#ede8de",background:tab===k?"#1a1208":"#fff",color:tab===k?"#fff":"#1a1208",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>{l}</button>)}</div>
    {tab==="orders"&&<>{mine.length===0&&<div className="card" style={{textAlign:"center",padding:24,color:"#8a8078"}}>No orders yet!</div>}{mine.map(o=><div key={o.id} className="card fadeup" style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div><p style={{fontWeight:700,fontSize:13}}>{o.id}</p><p style={{color:"#8a8078",fontSize:11}}>{o.time} - {o.type}</p></div><div style={{textAlign:"right"}}><p style={{fontWeight:700,color:"#bf4626"}}>{fmt(o.total)}</p><span className="bdg" style={{background:SB[o.status],color:SC[o.status],marginTop:2}}>{SL[o.status]}</span></div></div><p style={{fontSize:11,color:"#8a8078"}}>{o.items.map(i=>i.name+" x"+i.qty).join(", ")}</p></div>)}</>}
    {tab==="reviews"&&<>{reviews.filter(r=>r.userId===user.id).length===0&&<div className="card" style={{textAlign:"center",padding:24,color:"#8a8078"}}>No reviews yet</div>}{reviews.filter(r=>r.userId===user.id).map(r=><div key={r.id} className="card fadeup" style={{marginBottom:9}}><p style={{fontSize:13}}>{r.comment}</p><p style={{fontSize:11,color:"#8a8078",marginTop:3}}>{r.date}</p></div>)}</>}
    {tab==="book"&&<>{reservations.filter(r=>r.userId===user.id).length===0&&<div className="card" style={{textAlign:"center",padding:24,color:"#8a8078"}}>No reservations yet</div>}{reservations.filter(r=>r.userId===user.id).map(r=><div key={r.id} className="card fadeup" style={{marginBottom:9,borderLeft:"4px solid #059669"}}><p style={{fontWeight:700,fontSize:13,marginBottom:1}}>{(branches.find(b=>b.id===r.branchId)||{}).name}</p><p style={{color:"#8a8078",fontSize:12}}>{r.date} at {r.time} - {r.guests} guests</p></div>)}</>}
    {tab==="dietary"&&<div className="card" style={{padding:14}}>
      <p style={{fontWeight:700,fontSize:14,marginBottom:5}}>Dietary Preferences & Allergies</p>
      <p style={{fontSize:11,color:"#8a8078",marginBottom:12}}>Tap your dietary needs. Menu items containing your allergens will show warnings.</p>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["al-gluten","Gluten Free","#dc2626"],["al-dairy","Dairy Free","#2563eb"],["al-nuts","Nut Free","#d97706"],["al-shellfish","Shellfish Free","#7c3aed"],["al-veggie","Vegetarian","#059669"],["al-vegan","Vegan","#10b981"]].map(([id,label,color])=><button key={id} onClick={()=>toggleDiet(id)} style={{padding:"9px 14px",borderRadius:9,fontWeight:700,fontSize:12,background:diet.includes(id)?color:"#fff",color:diet.includes(id)?"#fff":color,border:"2px solid "+color,cursor:"pointer"}}>{diet.includes(id)?EM.check+" ":""}{label}</button>)}
      </div>
      {diet.length>0&&<p style={{fontSize:11,color:"#059669",marginTop:11,fontWeight:700}}>{EM.check} Saved - menu will respect your preferences</p>}
    </div>}
    {tab==="loyalty"&&<div>
      <div className="card" style={{padding:14,marginBottom:9,background:"linear-gradient(135deg,"+tier.color+",#d4952a)",color:"#fff"}}>
        <p style={{fontSize:11,opacity:.85,letterSpacing:2,fontWeight:700,marginBottom:4}}>{tier.name.toUpperCase()} TIER</p>
        <p style={{fontSize:32,fontWeight:700,marginBottom:3}}>{pts.toLocaleString()} points</p>
        <p style={{fontSize:11,opacity:.9}}>= {EM.pound}{(pts/100).toFixed(2)} potential discount</p>
      </div>
      <p style={{fontSize:13,fontWeight:700,marginBottom:6}}>Recent Activity</p>
      {loyaltyHistory.length===0?<div className="card" style={{textAlign:"center",padding:24,color:"#8a8078"}}>No loyalty activity yet</div>:loyaltyHistory.map(h=><div key={h.id} className="card" style={{padding:"10px 12px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{fontSize:12,fontWeight:600}}>{h.description||(h.type==="earn"?"Order rewards":"Discount redeemed")}</p><p style={{fontSize:10,color:"#8a8078"}}>{new Date(h.created_at).toLocaleDateString("en-GB")}{h.order_id?" - "+h.order_id:""}</p></div><p style={{fontWeight:700,color:h.points>0?"#059669":"#dc2626",fontSize:14}}>{h.points>0?"+":""}{h.points}</p></div>)}
    </div>}
  </div>;
}

function ChatV({messages,setMessages,user,onAuth}){
  var [text,setText]=useState(""),bottom=useRef(null);
  useEffect(()=>bottom.current?.scrollIntoView({behavior:"smooth"}),[messages]);
  var send=()=>{if(!text.trim())return;setMessages(ms=>[...ms,{id:"m"+Date.now(),userId:user?.id||"guest",name:user?.name||"Guest",text:text.trim(),time:nowT(),role:user?.role||"customer"}]);setText("");};
  var rc={owner:"#bf4626",kitchen:"#059669",customer:"#6b7280"};
  return <div style={{maxWidth:560,margin:"0 auto",height:"calc(100vh - 130px)",display:"flex",flexDirection:"column",padding:"0 14px"}}>
    <div style={{padding:"12px 0 8px",borderBottom:"1px solid #ede8de",display:"flex",alignItems:"center",gap:7}}><h2 style={{fontSize:20}}>Live Chat</h2><span style={{width:7,height:7,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/><span style={{color:"#8a8078",fontSize:12}}>Live</span></div>
    <div style={{flex:1,overflowY:"auto",padding:"12px 0",display:"flex",flexDirection:"column",gap:7}}>
      {messages.map(m=>{var isMe=m.userId===user?.id;return <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:2}}>{!isMe&&<span style={{fontSize:11,fontWeight:700,color:rc[m.role]||"#999",paddingLeft:10}}>{m.name}</span>}<div style={{padding:"8px 13px",maxWidth:"76%",fontSize:14,lineHeight:1.4,borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isMe?"#bf4626":"#fff",color:isMe?"#fff":"#1a1208",border:isMe?"none":"1px solid #ede8de"}}>{m.text}</div><span style={{fontSize:10,color:"#bbb",paddingLeft:isMe?0:10,paddingRight:isMe?10:0}}>{m.time}</span></div>;})}
      <div ref={bottom}/>
    </div>
    {user?<div style={{padding:"9px 0",borderTop:"1px solid #ede8de",display:"flex",gap:7}}><input className="field" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Type a message..." style={{flex:1,borderRadius:50,padding:"9px 15px"}}/><button className="btn btn-r" onClick={send} style={{borderRadius:50,padding:"9px 16px",flexShrink:0}}>Send</button></div>:<div style={{padding:"10px 0",borderTop:"1px solid #ede8de",textAlign:"center"}}><button className="btn btn-o" onClick={onAuth} style={{padding:"9px 22px"}}>Sign in to chat</button></div>}
  </div>;
}

function KitchenV({orders,setOrders,push,stations,menu}){
  // Persisted in localStorage: chef's selected station view
  var [view,setView]=useState(()=>{try{return localStorage.getItem("kitchen_view")||"";}catch(e){return "";}});
  var changeView=v=>{setView(v);try{localStorage.setItem("kitchen_view",v);}catch(e){}};

  var activeStations=(stations||[]).filter(s=>s.active!==false);
  // Kitchen only shows ACCEPTED orders (preparing). Pending orders are awaiting staff acceptance in Incoming.
  // EXCEPTION: Show pending orders that are NOT from "online" or "qr-table" sources (those need staff acceptance via Incoming)
  // Staff/phone orders go straight to preparing, but if any pending staff orders exist, they should still show
  var allOrders=orders.filter(o=>{
    if(o.status==="preparing")return true;
    if(o.status==="pending"&&o.source!=="online"&&o.source!=="qr-table")return true;
    return false;
  });

  // Helper: find station for menu item
  var stationForItem=(itemId,itemName)=>{
    var m=menu.find(x=>String(x.id)===String(itemId)||x.name===itemName);
    return m?.station||null;
  };

  // Filter items per view
  var getOrderItems=(o,filterStation)=>{
    if(!filterStation||filterStation==="all"||filterStation==="manager")return o.items;
    return (o.items||[]).filter(it=>stationForItem(it.id,it.name)===filterStation);
  };

  // Mark a station's items ready for an order
  var markStationReady=(orderId,stationName)=>{
    var order=orders.find(o=>o.id===orderId);
    if(!order)return;
    var progress={...(order.stationProgress||{})};
    progress[stationName]=true;
    setOrders(os=>os.map(o=>o.id===orderId?{...o,stationProgress:progress}:o));
    dbUpdateStationProgress(orderId,stationName,true).catch(e=>console.log("Station progress save:",e));
    // Check if ALL stations needed by this order are now ready
    var stationsInOrder=new Set();
    (order.items||[]).forEach(it=>{var st=stationForItem(it.id,it.name);if(st)stationsInOrder.add(st);});
    var allReady=[...stationsInOrder].every(st=>progress[st]);
    if(allReady&&stationsInOrder.size>0){
      setOrders(os=>os.map(o=>o.id===orderId?{...o,status:"ready"}:o));
      dbUpdateOrderStatus(orderId,"ready").catch(e=>{});
      push({title:"Order Ready!",body:orderId+" - all stations done",color:"#059669"});
    }else{
      push({title:stationName+" done",body:orderId,color:"#2563eb"});
    }
  };

  var startAll=id=>{
    setOrders(os=>os.map(o=>o.id===id?{...o,status:"preparing"}:o));
    dbUpdateOrderStatus(id,"preparing").catch(e=>{});
    push({title:id,body:"-> preparing",color:"#2563eb"});
  };
  var cancel=id=>{
    setOrders(os=>os.map(x=>x.id===id?{...x,status:"cancelled"}:x));
    dbUpdateOrderStatus(id,"cancelled").catch(e=>{});
  };

  // STATION PICKER (first time)
  if(!view&&activeStations.length>0){
    return <div className="kbg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:600,width:"100%"}}>
        <h1 style={{color:"#fff",fontSize:28,marginBottom:6,textAlign:"center"}}>Kitchen Display</h1>
        <p style={{color:"#888",fontSize:14,marginBottom:24,textAlign:"center"}}>Choose your station</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:14}}>
          {activeStations.map(s=><button key={s.dbId} onClick={()=>changeView(s.name)} style={{padding:"24px 14px",background:s.color,color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontWeight:700,fontSize:16,boxShadow:"0 4px 14px rgba(0,0,0,.3)"}}>{s.name}</button>)}
        </div>
        <button onClick={()=>changeView("manager")} style={{width:"100%",padding:"16px",background:"#1a1208",color:"#d4952a",border:"2px solid #d4952a",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:14}}>Manager View - See All Stations</button>
        <button onClick={()=>changeView("all")} style={{width:"100%",padding:"12px",background:"transparent",color:"#888",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,marginTop:6}}>Or show everything (legacy mode)</button>
      </div>
    </div>;
  }

  // MANAGER MODE - shows all stations grouped per order
  if(view==="manager"){
    return <div className="kbg"><div style={{maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <h2 style={{color:"#fff",fontSize:18}}>Manager Kitchen View</h2>
          <p style={{color:"#666",fontSize:11}}>{allOrders.length} active orders - all stations</p>
        </div>
        <button onClick={()=>changeView("")} style={{padding:"6px 12px",background:"transparent",color:"#888",border:"1px solid #444",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Change Station</button>
      </div>
      {allOrders.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#444"}}><p style={{fontSize:32,marginBottom:7}}>OK</p><p>All caught up!</p></div>:<div className="ag">
        {allOrders.map(o=>{
          var prog=o.stationProgress||{};
          var stationsInOrder=new Set();
          (o.items||[]).forEach(it=>{var st=stationForItem(it.id,it.name);if(st)stationsInOrder.add(st);else stationsInOrder.add("Unassigned");});
          return <div key={o.id} style={{background:"#0f0a06",border:"2px solid #d97706",borderRadius:12,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div><p style={{color:"#fff",fontWeight:700,fontSize:15}}>{o.id}</p><p style={{color:"#888",fontSize:11}}>{o.customer} - {o.time}</p></div>
              <span className="bdg" style={{background:SB[o.status],color:SC[o.status]}}>{SL[o.status]}</span>
            </div>
            {[...stationsInOrder].map(stName=>{
              var stItems=(o.items||[]).filter(it=>(stationForItem(it.id,it.name)||"Unassigned")===stName);
              var stObj=activeStations.find(s=>s.name===stName);
              var ready=prog[stName];
              return <div key={stName} style={{borderLeft:"3px solid "+(stObj?.color||"#666"),paddingLeft:9,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <p style={{color:stObj?.color||"#888",fontSize:11,fontWeight:700,letterSpacing:1}}>{stName.toUpperCase()}</p>
                  <span style={{fontSize:10,color:ready?"#10b981":"#666",fontWeight:700}}>{ready?"READY":"WAITING"}</span>
                </div>
                {stItems.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#fff",padding:"2px 0"}}><span>{it.name}</span><span style={{color:"#f59e0b",fontWeight:700}}>x{it.qty}</span></div>)}
              </div>;
            })}
            <div style={{display:"flex",gap:5,marginTop:9}}>
              {o.status==="pending"&&<button onClick={()=>startAll(o.id)} style={{flex:1,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700,background:"#2563eb",color:"#fff",border:"none",cursor:"pointer"}}>Start All</button>}
              <button onClick={()=>cancel(o.id)} style={{padding:"7px 12px",borderRadius:7,border:"1px solid #dc2626",color:"#dc2626",background:"transparent",fontWeight:700,fontSize:11,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>;
        })}
      </div>}
    </div></div>;
  }

  // STATION OR ALL VIEW
  var stationFilter=view==="all"?null:view;
  var relevantOrders=allOrders.filter(o=>{
    if(!stationFilter)return true;
    return (o.items||[]).some(it=>stationForItem(it.id,it.name)===stationFilter);
  });
  var stationObj=activeStations.find(s=>s.name===view);

  return <div className="kbg"><div style={{maxWidth:940,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {stationObj&&<div style={{width:10,height:30,background:stationObj.color,borderRadius:3}}/>}
        <div>
          <h2 style={{color:"#fff",fontSize:18}}>{view==="all"?"All Items":(stationObj?.name||view)+" Station"}</h2>
          <p style={{color:"#666",fontSize:11}}>{relevantOrders.length} orders need attention</p>
        </div>
      </div>
      <button onClick={()=>changeView("")} style={{padding:"6px 12px",background:"transparent",color:"#888",border:"1px solid #444",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Change Station</button>
    </div>
    {relevantOrders.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#444"}}><p style={{fontSize:32,marginBottom:7}}>OK</p><p style={{fontSize:14}}>No items for {view==="all"?"any station":view} right now</p></div>}
    <div className="ag">{relevantOrders.map(o=>{
      var myItems=getOrderItems(o,stationFilter);
      if(myItems.length===0&&stationFilter)return null;
      var alreadyReady=stationFilter&&(o.stationProgress||{})[stationFilter];
      return <div key={o.id} style={{background:o.status==="pending"?"#1a0a06":"#06101a",border:"2px solid "+(alreadyReady?"#10b981":(o.status==="pending"?"#d97706":"#2563eb")),borderRadius:12,padding:13,opacity:alreadyReady?.5:1}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div><p style={{color:"#fff",fontWeight:700,fontSize:14}}>{o.id}</p><p style={{color:"#666",fontSize:10}}>{o.customer} - {o.time}{o.slot?" | "+o.slot:""}{o.tableId?" | Table "+o.tableId:""}</p></div>
          <span className="bdg" style={{background:SB[o.status],color:SC[o.status]}}>{alreadyReady?"DONE":SL[o.status]}</span>
        </div>
        {myItems.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.07)",fontSize:13}}><span style={{color:"#fff",fontWeight:600}}>{it.name}</span><span style={{color:"#f59e0b",fontWeight:700,fontSize:15}}>x{it.qty}</span></div>)}
        <div style={{display:"flex",gap:5,marginTop:10}}>
          {!alreadyReady&&stationFilter&&stationFilter!=="all"&&<button onClick={()=>markStationReady(o.id,stationFilter)} style={{flex:1,padding:"8px",borderRadius:7,fontSize:12,fontWeight:700,background:"#059669",color:"#fff",border:"none",cursor:"pointer"}}>{EM.check} {stationFilter} Ready</button>}
          {(!stationFilter||view==="all")&&<button onClick={()=>{
            var order=orders.find(x=>x.id===o.id);
            var next=order.status==="pending"?"preparing":"ready";
            setOrders(os=>os.map(x=>x.id===o.id?{...x,status:next}:x));
            dbUpdateOrderStatus(o.id,next).catch(e=>{});
          }} style={{flex:1,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700,background:o.status==="pending"?"#2563eb":"#059669",color:"#fff",border:"none",cursor:"pointer"}}>{o.status==="pending"?"Start":"Mark Ready"}</button>}
          <button onClick={()=>cancel(o.id)} style={{padding:"7px 9px",borderRadius:7,border:"1px solid #dc2626",color:"#dc2626",background:"transparent",fontWeight:700,fontSize:11,cursor:"pointer"}}>X</button>
        </div>
      </div>;
    })}</div>
  </div></div>;
}

// -- CATEGORIES ----------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
var CATEGORIES0=[
  {id:"cat1",name:"Starters",icon:"soup",order:1},
  {id:"cat2",name:"Mains",icon:"pizza",order:2},
  {id:"cat3",name:"Sides",icon:"fries",order:3},
  {id:"cat4",name:"Desserts",icon:"choc",order:4},
  {id:"cat5",name:"Drinks",icon:"drink",order:5},
];

// -- SET MEALS / COMBOS --------------------------------------------------------
// eslint-disable-next-line no-unused-vars
var SETMEALS0=[
  {id:"sm1",name:"Burger Combo",desc:"Any burger + fries + soft drink",price:19.99,itemIds:[5,8,12],avail:true,icon:"burger"},
  {id:"sm2",name:"Pizza Night",desc:"Pizza + salad + drink",price:18.99,itemIds:[4,9,12],avail:true,icon:"pizza"},
  {id:"sm3",name:"Italian Feast",desc:"Pasta + bruschetta + tiramisu",price:22.99,itemIds:[7,2,10],avail:true,icon:"pasta"},
];

// -- MODIFIERS (size/extras/allergens) -----------------------------------------
var MODIFIERS0={
  size:[
    {id:"sz-reg",name:"Regular",priceAdj:0},
    {id:"sz-lg",name:"Large",priceAdj:3.00},
  ],
  cooking:[
    {id:"ck-rare",name:"Rare",priceAdj:0},
    {id:"ck-med",name:"Medium",priceAdj:0},
    {id:"ck-well",name:"Well Done",priceAdj:0},
  ],
  extras:[
    {id:"ex-cheese",name:"Extra Cheese",priceAdj:1.50},
    {id:"ex-bacon",name:"Add Bacon",priceAdj:2.00},
    {id:"ex-egg",name:"Add Egg",priceAdj:1.00},
    {id:"ex-mushroom",name:"Mushrooms",priceAdj:1.00},
  ],
  allergens:[
    {id:"al-gluten",name:"Contains Gluten"},
    {id:"al-dairy",name:"Contains Dairy"},
    {id:"al-nuts",name:"Contains Nuts"},
    {id:"al-shellfish",name:"Contains Shellfish"},
    {id:"al-veggie",name:"Vegetarian"},
    {id:"al-vegan",name:"Vegan"},
    {id:"al-gf",name:"Gluten Free"},
  ],
};

// Icon picker - organized by category for easy browsing
var ICON_KEYS=[
  // Indian / South Asian
  "curry","rice","naan","samosa","kebab","chicken","tea","thali","bowl","pot",
  // Meat & Protein
  "chickenleg","meat","steak","fish","egg","cheese","bacon","squid","shawarma","falafel",
  // Mains
  "pizza","burger","pasta","noodles","ramen","sushi","dumpling","salad","bento",
  // Sides & Veg
  "fries","bread","bagel","croissant","corn","carrot","potato","broccoli","onion","garlic",
  // Desserts & Sweets
  "cake","cupcake","donut","cookie","icecream","choc","sweet","pudding","honey","lolly",
  // Drinks
  "coffee","drink","water","milk","juice","bubbletea","beer","wine","cocktail","tropical","champagne",
  // Fruits
  "apple","banana","mango","coconut","lemon","orange","grape","watermelon","strawberry","pineapple","tomato",
  // Labels / Indicators
  "fire","spicy","leaf","veg","star","party","cook","chili",
  // Utility
  "cart","pin","cal","person","chat","gear","chart","bag","wave","phone","clock","check","cross"
];

// -- MENU ITEM EDITOR MODAL ----------------------------------------------------
function MenuEditor({item,onSave,onClose,onDelete,modifiers,categories,stations}){
  var isNew=!item||!item.id;
  var [f,setF]=useState({
    id:item?.id||Date.now(),
    name:item?.name||"",
    price:item?.price||0,
    desc:item?.desc||"",
    cat:item?.cat||"Mains",
    icon:item?.icon||"cart",
    avail:item?.avail!==false,
    stock:item?.stock??20,
    station:item?.station||"",
    priceDineIn:item?.priceDineIn||"",
    priceTakeaway:item?.priceTakeaway||"",
    priceDelivery:item?.priceDelivery||"",
    availDineIn:item?.availDineIn!==false,
    availTakeaway:item?.availTakeaway!==false,
    availDelivery:item?.availDelivery!==false,
    allergens:item?.allergens||[],
    sizes:item?.sizes||[],
    extras:item?.extras||[],
    cookingOpts:item?.cookingOpts||[],
  });
  var [confirmDel,setConfirmDel]=useState(false);
  var update=(k,v)=>setF(x=>({...x,[k]:v}));
  var toggleArr=(k,id)=>setF(x=>({...x,[k]:x[k].includes(id)?x[k].filter(i=>i!==id):[...x[k],id]}));
  var save=()=>{
    if(!f.name.trim()){alert("Name is required");return;}
    if(!f.price||f.price<=0){alert("Valid price is required");return;}
    onSave({...f,price:+f.price,stock:+f.stock});
    onClose();
  };

  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:500,padding:22,marginTop:20,marginBottom:40}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:22}}>{isNew?"Add Menu Item":"Edit Item"}</h2>
        <button onClick={onClose} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
      </div>

      {/* Icon picker */}
      <div style={{marginBottom:14}}>
        <label className="lbl">Icon ({f.icon})</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(45px,1fr))",gap:4,maxHeight:200,overflowY:"auto",padding:8,background:"#f7f3ee",borderRadius:8,border:"1px solid #ede8de"}}>
          {ICON_KEYS.map(k=><button key={k} onClick={()=>update("icon",k)} title={k} style={{padding:8,borderRadius:7,fontSize:22,background:f.icon===k?"#bf4626":"#fff",border:"2px solid "+(f.icon===k?"#bf4626":"#ede8de"),cursor:"pointer",aspectRatio:"1/1"}}>{EM[k]||""}</button>)}
        </div>
      </div>

      <div className="g2" style={{marginBottom:12}}>
        <div><label className="lbl">Name *</label><input className="field" value={f.name} onChange={e=>update("name",e.target.value)} placeholder="Margherita Pizza"/></div>
        <div><label className="lbl">Price (GBP) *</label><input type="number" step="0.01" className="field" value={f.price} onChange={e=>update("price",e.target.value)} placeholder="9.99"/></div>
      </div>

      <div style={{marginBottom:12}}><label className="lbl">Description</label><textarea className="field" value={f.desc} onChange={e=>update("desc",e.target.value)} rows={2} style={{resize:"vertical"}} placeholder="San Marzano tomato, fior di latte, basil"/></div>

      <div className="g2" style={{marginBottom:12}}>
        <div><label className="lbl">Category</label>
          <select className="field" value={f.cat} onChange={e=>update("cat",e.target.value)}>
            {(categories||[{name:"Starters"},{name:"Mains"},{name:"Sides"},{name:"Desserts"},{name:"Drinks"}]).map(c=><option key={c.id||c.name}>{c.name}</option>)}
          </select>
        </div>
        <div><label className="lbl">Stock</label><input type="number" className="field" value={f.stock} onChange={e=>update("stock",e.target.value)}/></div>
      </div>
      <div style={{marginBottom:12}}>
        <label className="lbl">Kitchen Station <span style={{color:"#8a8078",fontWeight:400}}>(which chef makes this?)</span></label>
        <select className="field" value={f.station||""} onChange={e=>update("station",e.target.value)}>
          <option value="">-- Not assigned --</option>
          {(stations||[]).filter(s=>s.active!==false).map(s=><option key={s.dbId} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div style={{padding:"11px 13px",background:"#fafaf5",borderRadius:9,marginBottom:12,border:"1px solid #ede8de"}}>
        <p style={{fontWeight:700,fontSize:13,marginBottom:6}}>Per-Type Pricing</p>
        <p style={{fontSize:10,color:"#8a8078",marginBottom:9}}>Leave blank to use the base price ({EM.pound}{f.price||"0.00"}) for that order type</p>
        <div className="g3" style={{gap:6}}>
          <div>
            <label className="lbl" style={{fontSize:10}}>Dine-in {EM.pound}</label>
            <input type="number" step="0.01" className="field" value={f.priceDineIn} onChange={e=>update("priceDineIn",e.target.value)} placeholder={f.price||"0.00"}/>
          </div>
          <div>
            <label className="lbl" style={{fontSize:10}}>Takeaway {EM.pound}</label>
            <input type="number" step="0.01" className="field" value={f.priceTakeaway} onChange={e=>update("priceTakeaway",e.target.value)} placeholder={f.price||"0.00"}/>
          </div>
          <div>
            <label className="lbl" style={{fontSize:10}}>Delivery {EM.pound}</label>
            <input type="number" step="0.01" className="field" value={f.priceDelivery} onChange={e=>update("priceDelivery",e.target.value)} placeholder={f.price||"0.00"}/>
          </div>
        </div>
        <p style={{fontWeight:700,fontSize:13,marginTop:11,marginBottom:6}}>Available For</p>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["availDineIn","Dine-in"],["availTakeaway","Takeaway / Collection"],["availDelivery","Delivery"]].map(([k,l])=><button key={k} onClick={()=>update(k,!f[k])} style={{padding:"7px 11px",fontSize:11,fontWeight:700,background:f[k]?"#059669":"#fee2e2",color:f[k]?"#fff":"#991b1b",border:"none",borderRadius:7,cursor:"pointer"}}>{f[k]?EM.check:EM.cross} {l}</button>)}
        </div>
      </div>

      {/* Sizes */}
      <div style={{marginBottom:12}}>
        <label className="lbl">Available Sizes</label>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {modifiers.size.map(s=><button key={s.id} onClick={()=>toggleArr("sizes",s.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:f.sizes.includes(s.id)?"#bf4626":"#fff",color:f.sizes.includes(s.id)?"#fff":"#1a1208",border:"2px solid "+(f.sizes.includes(s.id)?"#bf4626":"#ede8de"),cursor:"pointer"}}>{s.name}{s.priceAdj>0?" (+"+fmt(s.priceAdj)+")":""}</button>)}
        </div>
      </div>

      {/* Cooking preferences */}
      <div style={{marginBottom:12}}>
        <label className="lbl">Cooking Preferences (for meats)</label>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {modifiers.cooking.map(c=><button key={c.id} onClick={()=>toggleArr("cookingOpts",c.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:f.cookingOpts.includes(c.id)?"#d97706":"#fff",color:f.cookingOpts.includes(c.id)?"#fff":"#1a1208",border:"2px solid "+(f.cookingOpts.includes(c.id)?"#d97706":"#ede8de"),cursor:"pointer"}}>{c.name}</button>)}
        </div>
      </div>

      {/* Extras */}
      <div style={{marginBottom:12}}>
        <label className="lbl">Available Extras / Add-ons</label>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {modifiers.extras.map(x=><button key={x.id} onClick={()=>toggleArr("extras",x.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:f.extras.includes(x.id)?"#059669":"#fff",color:f.extras.includes(x.id)?"#fff":"#1a1208",border:"2px solid "+(f.extras.includes(x.id)?"#059669":"#ede8de"),cursor:"pointer"}}>{x.name} (+{fmt(x.priceAdj)})</button>)}
        </div>
      </div>

      {/* Allergens */}
      <div style={{marginBottom:12}}>
        <label className="lbl">Allergens / Dietary Info</label>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {modifiers.allergens.map(a=><button key={a.id} onClick={()=>toggleArr("allergens",a.id)} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:f.allergens.includes(a.id)?"#7c3aed":"#fff",color:f.allergens.includes(a.id)?"#fff":"#1a1208",border:"2px solid "+(f.allergens.includes(a.id)?"#7c3aed":"#ede8de"),cursor:"pointer"}}>{a.name}</button>)}
        </div>
      </div>

      <div style={{marginBottom:16}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={f.avail} onChange={e=>update("avail",e.target.checked)}/>
          <span style={{fontSize:13,fontWeight:600}}>Available to order</span>
        </label>
      </div>

      {confirmDel?<div style={{padding:14,background:"#fee2e2",borderRadius:9,marginBottom:12}}>
        <p style={{fontSize:13,fontWeight:700,color:"#991b1b",marginBottom:8}}>Delete this item permanently?</p>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-o" onClick={()=>setConfirmDel(false)} style={{flex:1}}>Cancel</button>
          <button onClick={()=>{onDelete(f.id);onClose();}} style={{flex:1,padding:"10px",background:"#dc2626",color:"#fff",border:"none",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Delete Forever</button>
        </div>
      </div>:<div style={{display:"flex",gap:8}}>
        <button className="btn btn-r" onClick={save} style={{flex:2,padding:"12px"}}>{isNew?"Add Item":"Save Changes"}</button>
        {!isNew&&<button onClick={()=>setConfirmDel(true)} style={{flex:1,padding:"12px",background:"#fff",color:"#dc2626",border:"2px solid #dc2626",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Delete</button>}
      </div>}
    </div>
  </div>;
}

// -- AI MENU IMPORT MODAL -----------------------------------------------------
function MenuImportModal({onClose,onImport,categories}){
  var [file,setFile]=useState(null);
  var [preview,setPreview]=useState(null);
  var [parsedMenu,setParsedMenu]=useState(null);
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState("");
  var [selectedItems,setSelectedItems]=useState({});

  var fileChange=e=>{
    var f=e.target.files[0];
    if(!f)return;
    if(f.size>10*1024*1024){setError("File too big - max 10MB");return;}
    setFile(f);setError("");setParsedMenu(null);
    // Preview image files
    if(f.type.startsWith("image/")){
      var reader=new FileReader();
      reader.onload=ev=>setPreview(ev.target.result);
      reader.readAsDataURL(f);
    }else{
      setPreview(null);
    }
  };

  var parseFile=async()=>{
    if(!file)return;
    setLoading(true);setError("");
    try{
      // Convert file to base64
      var reader=new FileReader();
      reader.onload=async ev=>{
        var base64=ev.target.result.split(",")[1];
        try{
          var res=await fetch("/api/parse-menu",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({fileBase64:base64,fileType:file.type,fileName:file.name}),
          });
          var data=await res.json();
          if(!res.ok){setError(data.error||"Failed to parse");setLoading(false);return;}
          setParsedMenu(data.menu);
          // Select all items by default
          var sel={};
          (data.menu.categories||[]).forEach((c,ci)=>(c.items||[]).forEach((it,ii)=>sel[ci+"-"+ii]=true));
          setSelectedItems(sel);
        }catch(err){setError("Network error: "+err.message);}
        setLoading(false);
      };
      reader.onerror=()=>{setError("Failed to read file");setLoading(false);};
      reader.readAsDataURL(file);
    }catch(err){setError(err.message);setLoading(false);}
  };

  var toggleItem=(ci,ii)=>{var k=ci+"-"+ii;setSelectedItems(s=>({...s,[k]:!s[k]}));};
  var toggleCategory=ci=>{
    if(!parsedMenu)return;
    var items=parsedMenu.categories[ci].items||[];
    var allSelected=items.every((_,ii)=>selectedItems[ci+"-"+ii]);
    setSelectedItems(s=>{var ns={...s};items.forEach((_,ii)=>ns[ci+"-"+ii]=!allSelected);return ns;});
  };

  var importAll=()=>{
    var newCats=[],newItems=[];
    (parsedMenu.categories||[]).forEach((c,ci)=>{
      var cat={id:"cat"+Date.now()+ci,name:c.name,icon:c.icon||"star",order:c.order||ci+1};
      var hasItems=false;
      (c.items||[]).forEach((it,ii)=>{
        if(!selectedItems[ci+"-"+ii])return;
        hasItems=true;
        newItems.push({id:Date.now()+ci*1000+ii,name:it.name,desc:it.description||"",price:parseFloat(it.price)||0,cat:c.name,icon:it.icon||"cart",stock:20,avail:true,allergens:it.allergens||[],sizes:[],extras:[],cookingOpts:[]});
      });
      if(hasItems){
        // Only add category if it's not already in database
        var exists=categories.find(ec=>ec.name.toLowerCase()===c.name.toLowerCase());
        if(!exists)newCats.push(cat);
      }
    });
    onImport(newCats,newItems);
    onClose();
  };

  var selectedCount=Object.values(selectedItems).filter(v=>v).length;

  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:8500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:650,padding:22,marginTop:20,marginBottom:40}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h2 style={{fontSize:22,display:"flex",alignItems:"center",gap:8}}>{EM.party} AI Menu Import</h2>
          <p style={{fontSize:12,color:"#8a8078",marginTop:3}}>Upload any menu (PDF, image, photo) - AI extracts everything</p>
        </div>
        <button onClick={onClose} style={{color:"#999",fontSize:24,border:"none",background:"none",cursor:"pointer"}}>x</button>
      </div>

      {!parsedMenu&&<>
        {/* Upload Zone */}
        <label style={{display:"block",border:"3px dashed "+(file?"#059669":"#ede8de"),borderRadius:12,padding:"30px 20px",textAlign:"center",cursor:"pointer",background:file?"#f0fdf4":"#fafaf8",transition:"all .2s"}}>
          <input type="file" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.heic" onChange={fileChange} style={{display:"none"}}/>
          {!file&&<>
            <p style={{fontSize:40,marginBottom:8}}>{EM.cart}</p>
            <p style={{fontSize:15,fontWeight:700,marginBottom:4}}>Tap to select menu file</p>
            <p style={{fontSize:12,color:"#8a8078"}}>PDF, JPG, PNG, HEIC - max 10MB</p>
          </>}
          {file&&<>
            <p style={{fontSize:30,marginBottom:6}}>{EM.check}</p>
            <p style={{fontSize:14,fontWeight:700,marginBottom:3}}>{file.name}</p>
            <p style={{fontSize:11,color:"#8a8078"}}>{(file.size/1024).toFixed(0)} KB - Tap to change</p>
          </>}
        </label>

        {preview&&<img src={preview} alt="Preview" style={{width:"100%",maxHeight:200,objectFit:"contain",marginTop:12,borderRadius:8,background:"#f7f3ee"}}/>}

        {error&&<div style={{padding:"10px 12px",background:"#fee2e2",borderRadius:8,marginTop:12,fontSize:13,color:"#991b1b"}}>{EM.cross} {error}</div>}

        <button className="btn btn-r" onClick={parseFile} disabled={!file||loading} style={{width:"100%",padding:"13px",fontSize:15,marginTop:14}}>
          {loading?"AI is reading your menu... (10-30 seconds)":"Parse Menu with AI"}
        </button>

        <div style={{marginTop:14,padding:"10px 12px",background:"#fffbeb",borderRadius:8,fontSize:11,color:"#92400e"}}>
          <strong>Tip:</strong> Clear photos work best. Make sure text is readable and the whole menu is visible.
        </div>
      </>}

      {parsedMenu&&<>
        <div style={{padding:"12px 14px",background:"#d1fae5",borderRadius:9,marginBottom:14,border:"2px solid #059669"}}>
          <p style={{fontSize:14,fontWeight:700,color:"#065f46"}}>{EM.check} Parsed Successfully!</p>
          <p style={{fontSize:12,color:"#065f46",marginTop:3}}>Found {parsedMenu.categories?.length||0} categories, {selectedCount} items selected</p>
        </div>

        <div style={{maxHeight:"50vh",overflowY:"auto",border:"1px solid #ede8de",borderRadius:10,padding:10}}>
          {parsedMenu.categories?.map((c,ci)=>{
            var items=c.items||[];
            var allChecked=items.every((_,ii)=>selectedItems[ci+"-"+ii]);
            var someChecked=items.some((_,ii)=>selectedItems[ci+"-"+ii]);
            return <div key={ci} style={{marginBottom:14,padding:10,background:"#fafaf8",borderRadius:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:6,borderBottom:"2px solid #ede8de"}}>
                <input type="checkbox" checked={allChecked} ref={el=>{if(el)el.indeterminate=someChecked&&!allChecked;}} onChange={()=>toggleCategory(ci)} style={{width:18,height:18,cursor:"pointer"}}/>
                <span style={{fontSize:22}}>{EM[c.icon]||EM.star}</span>
                <p style={{fontWeight:700,fontSize:15,flex:1}}>{c.name}</p>
                <p style={{fontSize:11,color:"#8a8078"}}>{items.length} items</p>
              </div>
              {items.map((it,ii)=><label key={ii} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 4px",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="#fff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <input type="checkbox" checked={selectedItems[ci+"-"+ii]||false} onChange={()=>toggleItem(ci,ii)} style={{width:16,height:16,cursor:"pointer"}}/>
                <span style={{fontSize:18}}>{EM[it.icon]||EM.cart}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600}}>{it.name}</p>
                  {it.description&&<p style={{fontSize:11,color:"#8a8078",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.description}</p>}
                  {it.allergens&&it.allergens.length>0&&<div style={{display:"flex",gap:3,marginTop:2,flexWrap:"wrap"}}>{it.allergens.map((a,i)=><span key={i} style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:"#f5f0ff",color:"#7c3aed",fontWeight:700}}>{a}</span>)}</div>}
                </div>
                <p style={{fontSize:14,fontWeight:700,color:"#bf4626"}}>{fmt(it.price)}</p>
              </label>)}
            </div>;
          })}
        </div>

        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn btn-o" onClick={()=>{setParsedMenu(null);setFile(null);setPreview(null);}} style={{flex:1,padding:"12px"}}>Start Over</button>
          <button className="btn btn-r" onClick={importAll} disabled={selectedCount===0} style={{flex:2,padding:"12px"}}>Import {selectedCount} Items</button>
        </div>
      </>}
    </div>
  </div>;
}

// -- SET MEAL EDITOR MODAL -----------------------------------------------------
function SetMealEditor({meal,menu,onSave,onClose,onDelete}){
  var isNew=!meal||!meal.id;
  var [f,setF]=useState({
    id:meal?.id||"sm"+Date.now(),
    name:meal?.name||"",
    desc:meal?.desc||"",
    price:meal?.price||0,
    itemIds:meal?.itemIds||[],
    icon:meal?.icon||"party",
    avail:meal?.avail!==false,
  });
  var [confirmDel,setConfirmDel]=useState(false);
  var update=(k,v)=>setF(x=>({...x,[k]:v}));
  var toggleItem=id=>setF(x=>({...x,itemIds:x.itemIds.includes(id)?x.itemIds.filter(i=>i!==id):[...x.itemIds,id]}));
  var regularTotal=f.itemIds.reduce((s,id)=>{var m=menu.find(m=>m.id===id);return s+(m?.price||0);},0);
  var saving=regularTotal-f.price;
  var save=()=>{
    if(!f.name.trim()){alert("Name is required");return;}
    if(!f.price||f.price<=0){alert("Valid price is required");return;}
    if(!f.itemIds.length){alert("Select at least one item");return;}
    onSave({...f,price:+f.price});
    onClose();
  };

  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:500,padding:22,marginTop:20,marginBottom:40}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:22}}>{isNew?"Create Set Meal":"Edit Set Meal"}</h2>
        <button onClick={onClose} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
      </div>

      <div style={{marginBottom:12}}>
        <label className="lbl">Icon</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(45px,1fr))",gap:5,padding:6,background:"#f7f3ee",borderRadius:8,maxHeight:90,overflowY:"auto"}}>
          {ICON_KEYS.map(k=><button key={k} onClick={()=>update("icon",k)} style={{padding:6,borderRadius:6,fontSize:20,background:f.icon===k?"#7c3aed":"#fff",border:"2px solid "+(f.icon===k?"#7c3aed":"#ede8de"),cursor:"pointer"}}>{EM[k]||""}</button>)}
        </div>
      </div>

      <div style={{marginBottom:10}}><label className="lbl">Combo Name *</label><input className="field" value={f.name} onChange={e=>update("name",e.target.value)} placeholder="Burger Combo"/></div>
      <div style={{marginBottom:10}}><label className="lbl">Description</label><textarea className="field" value={f.desc} onChange={e=>update("desc",e.target.value)} rows={2} style={{resize:"vertical"}} placeholder="Any burger + fries + drink"/></div>
      <div style={{marginBottom:12}}><label className="lbl">Combo Price (GBP) *</label><input type="number" step="0.01" className="field" value={f.price} onChange={e=>update("price",e.target.value)} placeholder="19.99"/></div>

      <div style={{marginBottom:12}}>
        <label className="lbl">Items Included ({f.itemIds.length} selected)</label>
        <div style={{maxHeight:180,overflowY:"auto",border:"1px solid #ede8de",borderRadius:8,padding:4}}>
          {menu.filter(m=>m.avail).map(m=><button key={m.id} onClick={()=>toggleItem(m.id)} style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:6,background:f.itemIds.includes(m.id)?"#f5f0ff":"#fff",border:"2px solid "+(f.itemIds.includes(m.id)?"#7c3aed":"transparent"),cursor:"pointer",marginBottom:3,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{EM[m.icon]||""}</span>
            <span style={{flex:1,fontSize:12,fontWeight:600}}>{m.name}</span>
            <span style={{fontSize:11,color:"#bf4626",fontWeight:700}}>{fmt(m.price)}</span>
          </button>)}
        </div>
      </div>

      {f.itemIds.length>0&&f.price>0&&<div style={{padding:"10px 12px",background:saving>0?"#d1fae5":"#fef3c7",borderRadius:8,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
          <span>Regular total:</span><span style={{fontWeight:700}}>{fmt(regularTotal)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
          <span>Combo price:</span><span style={{fontWeight:700}}>{fmt(f.price)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,color:saving>0?"#059669":"#d97706",marginTop:4,paddingTop:4,borderTop:"1px solid rgba(0,0,0,.08)"}}>
          <span>{saving>0?"Customer saves:":"Warning - no saving"}</span>
          <span>{fmt(Math.abs(saving))}</span>
        </div>
      </div>}

      <div style={{marginBottom:14}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={f.avail} onChange={e=>update("avail",e.target.checked)}/>
          <span style={{fontSize:13,fontWeight:600}}>Available to order</span>
        </label>
      </div>

      {confirmDel?<div style={{padding:14,background:"#fee2e2",borderRadius:9,marginBottom:12}}>
        <p style={{fontSize:13,fontWeight:700,color:"#991b1b",marginBottom:8}}>Delete this combo permanently?</p>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-o" onClick={()=>setConfirmDel(false)} style={{flex:1}}>Cancel</button>
          <button onClick={()=>{onDelete(f.id);onClose();}} style={{flex:1,padding:"10px",background:"#dc2626",color:"#fff",border:"none",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Delete Forever</button>
        </div>
      </div>:<div style={{display:"flex",gap:8}}>
        <button className="btn btn-r" onClick={save} style={{flex:2,padding:"12px"}}>{isNew?"Create Combo":"Save Changes"}</button>
        {!isNew&&<button onClick={()=>setConfirmDel(true)} style={{flex:1,padding:"12px",background:"#fff",color:"#dc2626",border:"2px solid #dc2626",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Delete</button>}
      </div>}
    </div>
  </div>;
}

// -- CATEGORY EDITOR MODAL -----------------------------------------------------
function CategoryEditor({cat,onSave,onClose,onDelete,menu}){
  var isNew=!cat||!cat.id;
  var [f,setF]=useState({
    id:cat?.id||"cat"+Date.now(),
    name:cat?.name||"",
    icon:cat?.icon||"star",
    order:cat?.order||99,
  });
  var [confirmDel,setConfirmDel]=useState(false);
  var update=(k,v)=>setF(x=>({...x,[k]:v}));
  var usedBy=!isNew?menu.filter(m=>m.cat===cat.name).length:0;
  var save=()=>{
    if(!f.name.trim()){alert("Name is required");return;}
    onSave({...f,order:+f.order});
    onClose();
  };

  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:420,padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{fontSize:20}}>{isNew?"Add Category":"Edit Category"}</h2>
        <button onClick={onClose} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
      </div>

      <div style={{marginBottom:12}}>
        <label className="lbl">Icon</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(45px,1fr))",gap:5,padding:6,background:"#f7f3ee",borderRadius:8,maxHeight:120,overflowY:"auto"}}>
          {ICON_KEYS.map(k=><button key={k} onClick={()=>update("icon",k)} style={{padding:6,borderRadius:6,fontSize:20,background:f.icon===k?"#d4952a":"#fff",border:"2px solid "+(f.icon===k?"#d4952a":"#ede8de"),cursor:"pointer"}}>{EM[k]||""}</button>)}
        </div>
      </div>

      <div style={{marginBottom:10}}><label className="lbl">Category Name *</label><input className="field" value={f.name} onChange={e=>update("name",e.target.value)} placeholder="e.g. Breakfast, Specials, Kids Menu"/></div>
      <div style={{marginBottom:14}}><label className="lbl">Display Order</label><input type="number" className="field" value={f.order} onChange={e=>update("order",e.target.value)} placeholder="1-99 (lower shows first)"/><p style={{fontSize:11,color:"#8a8078",marginTop:4}}>Lower numbers appear first in the menu</p></div>

      {!isNew&&usedBy>0&&<div style={{padding:"10px 12px",background:"#fef3c7",borderRadius:8,marginBottom:12,fontSize:12,color:"#92400e"}}>
        This category is used by {usedBy} menu item{usedBy!==1?"s":""}. Renaming it will update them automatically.
      </div>}

      {confirmDel?<div style={{padding:14,background:"#fee2e2",borderRadius:9,marginBottom:12}}>
        <p style={{fontSize:13,fontWeight:700,color:"#991b1b",marginBottom:8}}>Delete this category?</p>
        {usedBy>0&&<p style={{fontSize:12,color:"#991b1b",marginBottom:8}}>Cannot delete - {usedBy} item(s) still use it. Move them to another category first.</p>}
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-o" onClick={()=>setConfirmDel(false)} style={{flex:1}}>Cancel</button>
          <button onClick={()=>{onDelete(f.id);onClose();}} disabled={usedBy>0} style={{flex:1,padding:"10px",background:usedBy>0?"#ccc":"#dc2626",color:"#fff",border:"none",borderRadius:9,fontWeight:700,cursor:usedBy>0?"not-allowed":"pointer"}}>Delete</button>
        </div>
      </div>:<div style={{display:"flex",gap:8}}>
        <button className="btn btn-r" onClick={save} style={{flex:2,padding:"12px"}}>{isNew?"Add Category":"Save Changes"}</button>
        {!isNew&&<button onClick={()=>setConfirmDel(true)} style={{flex:1,padding:"12px",background:"#fff",color:"#dc2626",border:"2px solid #dc2626",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Delete</button>}
      </div>}
    </div>
  </div>;
}

// -- TABLE EDITOR MODAL -----------------------------------------------------
function TableEditor({table,onSave,onClose,existingTables}){
  var [form,setForm]=useState({
    id:table.id||1,
    seats:table.seats||4,
    x:table.x||20,
    y:table.y||20,
    dbId:table.dbId,
    branchId:table.branchId,
    status:table.status||"free",
  });
  var isNew=!table.dbId;
  var numberTaken=isNew&&existingTables.some(t=>+t.id===+form.id);
  var save=()=>{
    if(numberTaken){alert("Table number "+form.id+" is already used in this branch");return;}
    if(form.seats<1||form.seats>20){alert("Seats must be between 1 and 20");return;}
    onSave(form);
  };
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:420,padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:20}}>{isNew?"Add Table":"Edit Table "+table.id}</h2>
        <button onClick={onClose} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
      </div>
      <div style={{marginBottom:12}}>
        <label className="lbl">Table Number</label>
        <input type="number" className="field" value={form.id} onChange={e=>setForm(f=>({...f,id:+e.target.value}))} min="1"/>
        {numberTaken&&<p style={{color:"#dc2626",fontSize:11,marginTop:3}}>This number is already taken in this branch</p>}
      </div>
      <div style={{marginBottom:12}}>
        <label className="lbl">Number of Seats</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
          {[2,4,6,8,10,12].map(n=><button key={n} onClick={()=>setForm(f=>({...f,seats:n}))} style={{padding:"10px 4px",fontSize:13,fontWeight:700,background:form.seats===n?"#bf4626":"#fff",color:form.seats===n?"#fff":"#1a1208",border:"2px solid "+(form.seats===n?"#bf4626":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{n}</button>)}
        </div>
        <input type="number" className="field" value={form.seats} onChange={e=>setForm(f=>({...f,seats:Math.max(1,+e.target.value)}))} min="1" max="20" style={{marginTop:6}} placeholder="Or enter custom seats"/>
      </div>
      <div style={{padding:"10px 12px",background:"#fffbeb",borderRadius:8,marginBottom:12,fontSize:11,color:"#92400e"}}>
        <strong>Tip:</strong> You can drag tables on the Tables view to reposition them later.
      </div>
      <div style={{display:"flex",gap:7}}>
        <button className="btn btn-o" onClick={onClose} style={{flex:1,padding:"11px"}}>Cancel</button>
        <button className="btn btn-r" onClick={save} disabled={numberTaken} style={{flex:2,padding:"11px"}}>{isNew?"Add Table":"Save Changes"}</button>
      </div>
    </div>
  </div>;
}

function AdminV({orders,setOrders,menu,setMenu,discounts,setDiscounts,push,branches,setMeals,setSetMeals,categories,setCategories,tables,setTables,branch,stations,setStations,user}){
  var [tab,setTab]=useState("orders"),[bf,setBF]=useState("all"),[nc,setNC]=useState({code:"",type:"percent",value:"",desc:""});
  var [editItem,setEditItem]=useState(null),[editMeal,setEditMeal]=useState(null),[editCat,setEditCat]=useState(null),[showImport,setShowImport]=useState(false),[editTable,setEditTable]=useState(null),[adminBranch,setAdminBranch]=useState(branch?.id||"b1"),[editStation,setEditStation]=useState(null);
  var [cashHandovers,setCashHandovers]=useState([]);
  var [handoverDriver,setHandoverDriver]=useState("");
  var [posUiStyle,setPosUiStyle]=useState(()=>{
    try{return localStorage.getItem("pos_ui_style")||"modern";}catch(e){return "modern";}
  });
  var [showDashboard,setShowDashboard]=useState(()=>{
    try{return localStorage.getItem("show_pos_dashboard")==="1";}catch(e){return false;}
  });
  var [kbSize,setKbSize]=useState(()=>{
    try{return localStorage.getItem("kb_size")||"medium";}catch(e){return "medium";}
  });
  var [menuSearch,setMenuSearch]=useState("");
  var [orderSearch,setOrderSearch]=useState("");
  var [advHours,setAdvHours]=useState({}); // { branchId: { Mon: { all_1: {...} }, Tue: ... } }
  var [holidays,setHolidays]=useState({}); // { branchId: [{ id, holiday_date, ... }] }
  var [hoursConfig,setHoursConfig]=useState({}); // { branchId: { use_per_service_hours, ... } }
  var [hoursLoading,setHoursLoading]=useState(false);
  var [editingBranch,setEditingBranch]=useState(null);
  var [showHolidayModal,setShowHolidayModal]=useState(false);
  var [editHoliday,setEditHoliday]=useState(null);

  // Load advanced hours from DB on mount
  useEffect(()=>{
    if(!branches||!branches.length)return;
    setHoursLoading(true);
    Promise.all(branches.map(b=>Promise.all([
      dbFetchBranchHours(b.id),
      dbFetchHolidays(b.id),
      dbFetchHoursConfig(b.id),
    ]))).then(results=>{
      var h={},hol={},cfg={};
      results.forEach((r,i)=>{
        var bid=branches[i].id;
        var hourRows=r[0]||[];
        h[bid]={};
        hourRows.forEach(row=>{
          if(!h[bid][row.day_of_week])h[bid][row.day_of_week]={};
          var key=row.service_type+"_"+row.service_window;
          h[bid][row.day_of_week][key]={
            id:row.id,
            is_closed:row.is_closed,
            open_time:row.open_time?row.open_time.slice(0,5):"",
            close_time:row.close_time?row.close_time.slice(0,5):"",
            last_order_time:row.last_order_time?row.last_order_time.slice(0,5):"",
          };
        });
        hol[bid]=r[1]||[];
        cfg[bid]=r[2]||{branch_id:bid,use_per_service_hours:false,block_orders_when_closed:true,block_orders_after_last_order:true,show_last_order_warning:true,warning_threshold_minutes:30,allow_staff_override:true};
      });
      setAdvHours(h);setHolidays(hol);setHoursConfig(cfg);setHoursLoading(false);
    }).catch(e=>{console.log("Hours load failed:",e);setHoursLoading(false);});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Save hours for a day
  var saveDayHours=(branchId,day,serviceType,serviceWindow,hours)=>{
    dbSaveBranchHours(branchId,day,serviceType,serviceWindow,hours).then(r=>{
      if(r.data){
        setAdvHours(h=>{
          var newH={...h};
          if(!newH[branchId])newH[branchId]={};
          if(!newH[branchId][day])newH[branchId][day]={};
          var key=serviceType+"_"+serviceWindow;
          newH[branchId][day][key]={...hours,id:r.data.id};
          return newH;
        });
      }
    });
  };

  // Save holiday
  var saveHoliday=(branchId,h)=>{
    dbSaveHoliday({...h,branch_id:branchId}).then(r=>{
      if(r.data){
        setHolidays(prev=>{
          var newHol={...prev};
          if(!newHol[branchId])newHol[branchId]=[];
          var existing=newHol[branchId].findIndex(x=>x.id===r.data.id);
          if(existing>=0)newHol[branchId][existing]=r.data;
          else newHol[branchId]=[...newHol[branchId],r.data].sort((a,b)=>a.holiday_date.localeCompare(b.holiday_date));
          return newHol;
        });
      }
    });
  };

  var deleteHoliday=(branchId,id)=>{
    if(!window.confirm("Delete this holiday?"))return;
    dbDeleteHoliday(id).then(()=>{
      setHolidays(prev=>{var newHol={...prev};newHol[branchId]=(newHol[branchId]||[]).filter(h=>h.id!==id);return newHol;});
    });
  };

  // Save config
  var saveConfig=(branchId,partial)=>{
    var current=hoursConfig[branchId]||{branch_id:branchId};
    var updated={...current,...partial};
    setHoursConfig(c=>({...c,[branchId]:updated}));
    dbSaveHoursConfig(updated);
  };
  var [orderDateFilter,setOrderDateFilter]=useState("all"); // all, today, yesterday, week, month, custom
  var [orderCustomFrom,setOrderCustomFrom]=useState("");
  var [orderCustomTo,setOrderCustomTo]=useState("");
  var [orderTypeFilter,setOrderTypeFilter]=useState("all"); // all, dine-in, takeaway, delivery, collection
  var [orderStatusFilter,setOrderStatusFilter]=useState("all"); // all, pending, preparing, ready, delivered, collected, cancelled
  var [orderSourceFilter,setOrderSourceFilter]=useState("all"); // all, online, qr-table, staff, phone
  var [menuSort,setMenuSort]=useState("az");
  var [menuFilterCat,setMenuFilterCat]=useState("all");
  var [menuFilterStation,setMenuFilterStation]=useState("all");
  var [menuFilterStatus,setMenuFilterStatus]=useState("all");
  var [handoverAmount,setHandoverAmount]=useState("");

  // Load cash handover history on mount + when admin tab opened
  useEffect(()=>{
    dbFetchHandovers().then(list=>setCashHandovers(list||[]));
  },[]);
  var [delivSettings,setDelivSettings]=useState({});
  var [promoCodes,setPromoCodes]=useState([]);
  var [autoDiscs,setAutoDiscs]=useState([]);
  var [editCode,setEditCode]=useState(null);
  var [editAuto,setEditAuto]=useState(null);

  // Load delivery and promo data
  useEffect(()=>{
    dbFetchAllDelivery().then(list=>{
      var map={};
      (list||[]).forEach(s=>{map[s.branch_id]={
        dbId:s.id,method:s.method,enabled:s.enabled,
        minOrder:parseFloat(s.min_order||0),freeOver:parseFloat(s.free_over||0),
        flatFee:parseFloat(s.flat_fee||0),maxRadius:s.max_radius||3,
        zones:s.zones||[],postcodes:s.postcodes||[],
        codEnabled:s.cod_enabled,codMinOrder:parseFloat(s.cod_min_order||15),codMaxMiles:s.cod_max_miles||3,
        serviceChargeEnabled:s.service_charge_enabled||false,
        serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
        serviceChargeMandatory:s.service_charge_mandatory||false,
        serviceChargeGroupSize:s.service_charge_group_size||6,
      };});
      setDelivSettings(map);
    });
    dbFetchCodes().then(list=>{
      setPromoCodes((list||[]).map(c=>({
        dbId:c.id,code:c.code,type:c.type,value:parseFloat(c.value),
        description:c.description,minOrder:parseFloat(c.min_order||0),
        maxUses:c.max_uses,uses:c.uses||0,expiresAt:c.expires_at,active:c.active,
        firstOrderOnly:c.first_order_only,branchIds:c.branch_ids||[],
      })));
    });
    dbFetchAutoDiscounts().then(list=>{
      setAutoDiscs((list||[]).map(a=>({
        dbId:a.id,name:a.name,description:a.description,ruleType:a.rule_type,
        minOrder:parseFloat(a.min_order||0),discountType:a.discount_type,
        discountValue:parseFloat(a.discount_value||0),active:a.active,
        firstOrderOnly:a.first_order_only,branchIds:a.branch_ids||[],
      })));
    });
  },[]);
  var fil=bf==="all"?orders:orders.filter(o=>o.branchId===bf),del=fil.filter(o=>o.status==="delivered"||o.status==="collected"),rev=del.reduce((s,o)=>s+o.total,0);
  var allSt=["pending","preparing","ready","delivered","collected","cancelled"];
  var upSt=(id,st)=>{
    setOrders(os=>os.map(o=>o.id===id?{...o,status:st}:o));
    push({title:"Updated",body:id+" -> "+SL[st],color:SC[st]});
    dbUpdateOrderStatus(id,st).catch(e=>console.log("Admin status save failed:",e));
  };
  var addCode=()=>{if(!nc.code||!nc.value)return;setDiscounts(ds=>[...ds,{code:nc.code.toUpperCase(),type:nc.type,value:+nc.value,desc:nc.desc,active:true,uses:0,max:9999}]);setNC({code:"",type:"percent",value:"",desc:""});};
  var saveItem=item=>{
    // Save to local state immediately (for instant UI)
    setMenu(ms=>{var ex=ms.find(m=>m.id===item.id);return ex?ms.map(m=>m.id===item.id?item:m):[...ms,item];});
    // Save to database
    dbSaveMenuItem(item).then(result=>{
      if(result.error){push({title:"DB save failed",body:result.error.message||"Try again",color:"#dc2626"});}
      else{
        push({title:"Saved",body:item.name,color:"#059669"});
        // Update the local state with the database ID
        if(result.data&&result.data.id){
          setMenu(ms=>ms.map(m=>m.id===item.id?{...m,dbId:result.data.id,id:result.data.id}:m));
        }
      }
    }).catch(e=>{console.error(e);push({title:"Error",body:"Could not save",color:"#dc2626"});});
  };
  var deleteItem=id=>{
    var item=menu.find(m=>m.id===id);
    setMenu(ms=>ms.filter(m=>m.id!==id));
    if(item?.dbId){
      dbDeleteMenuItem(item.dbId).then(result=>{
        if(result.error){push({title:"Delete failed",body:result.error.message,color:"#dc2626"});}
        else{push({title:"Deleted",body:"Menu item removed",color:"#dc2626"});}
      });
    }else{push({title:"Deleted",body:"Menu item removed",color:"#dc2626"});}
  };
  var saveMeal=meal=>{
    setSetMeals(ms=>{var ex=ms.find(m=>m.id===meal.id);return ex?ms.map(m=>m.id===meal.id?meal:m):[...ms,meal];});
    dbSaveSetMeal(meal).then(result=>{
      if(result.error){push({title:"DB save failed",body:result.error.message||"Try again",color:"#dc2626"});}
      else{
        push({title:"Saved",body:meal.name,color:"#059669"});
        if(result.data&&result.data.id){
          setSetMeals(ms=>ms.map(m=>m.id===meal.id?{...m,dbId:result.data.id,id:result.data.id}:m));
        }
      }
    }).catch(e=>{console.error(e);push({title:"Error",body:"Could not save",color:"#dc2626"});});
  };
  var deleteMeal=id=>{
    var meal=setMeals.find(m=>m.id===id);
    setSetMeals(ms=>ms.filter(m=>m.id!==id));
    if(meal?.dbId){
      dbDeleteSetMeal(meal.dbId).then(result=>{
        if(result.error){push({title:"Delete failed",body:result.error.message,color:"#dc2626"});}
        else{push({title:"Deleted",body:"Combo removed",color:"#dc2626"});}
      });
    }else{push({title:"Deleted",body:"Combo removed",color:"#dc2626"});}
  };
  var saveCat=cat=>{
    setCategories(cs=>{var ex=cs.find(c=>c.id===cat.id);return ex?cs.map(c=>c.id===cat.id?cat:c):[...cs,cat];});
    dbSaveCategory(cat).then(result=>{
      if(result.error){push({title:"DB save failed",body:result.error.message||"Try again",color:"#dc2626"});}
      else{
        push({title:"Saved",body:cat.name,color:"#059669"});
        if(result.data&&result.data.id){
          setCategories(cs=>cs.map(c=>c.id===cat.id?{...c,dbId:result.data.id,id:result.data.id}:c));
        }
      }
    }).catch(e=>{console.error(e);push({title:"Error",body:"Could not save",color:"#dc2626"});});
  };
  var deleteCat=id=>{
    var cat=categories.find(c=>c.id===id);
    var used=menu.filter(m=>m.cat===cat?.name).length;
    if(used>0){alert("Cannot delete - "+used+" menu item(s) use this category. Move them first.");return;}
    setCategories(cs=>cs.filter(c=>c.id!==id));
    if(cat?.dbId){
      dbDeleteCategory(cat.dbId).then(result=>{
        if(result.error){push({title:"Delete failed",body:result.error.message,color:"#dc2626"});}
        else{push({title:"Deleted",body:"Category removed",color:"#dc2626"});}
      });
    }else{push({title:"Deleted",body:"Category removed",color:"#dc2626"});}
  };
  var bulkImport=(newCats,newItems)=>{
    // Save each category to DB
    newCats.forEach(cat=>{
      setCategories(cs=>[...cs,cat]);
      dbSaveCategory(cat).then(r=>{
        if(r.data&&r.data.id){setCategories(cs=>cs.map(c=>c.id===cat.id?{...c,dbId:r.data.id,id:r.data.id}:c));}
      });
    });
    // Save each item to DB
    newItems.forEach(item=>{
      setMenu(ms=>[...ms,item]);
      dbSaveMenuItem(item).then(r=>{
        if(r.data&&r.data.id){setMenu(ms=>ms.map(m=>m.id===item.id?{...m,dbId:r.data.id,id:r.data.id}:m));}
      });
    });
    push({title:"Imported!",body:newItems.length+" items, "+newCats.length+" categories",color:"#059669"});
  };

  // Tables management
  var saveTable=tbl=>{
    if(tbl.dbId){
      // Update existing
      setTables(ts=>ts.map(t=>t.dbId===tbl.dbId?tbl:t));
      dbSaveTable(tbl).then(r=>{
        if(r.error)push({title:"Save failed",body:r.error.message,color:"#dc2626"});
        else push({title:"Table updated",body:"Table "+tbl.id,color:"#059669"});
      });
    }else{
      // Insert new
      var newT={...tbl,branchId:adminBranch,status:"free"};
      setTables(ts=>[...ts,newT]);
      dbSaveTable(newT).then(r=>{
        if(r.error){push({title:"Save failed",body:r.error.message,color:"#dc2626"});}
        else if(r.data){
          setTables(ts=>ts.map(t=>(t.id===newT.id&&!t.dbId)?{...t,dbId:r.data.id}:t));
          push({title:"Table added",body:"Table "+tbl.id,color:"#059669"});
        }
      });
    }
    setEditTable(null);
  };
  var deleteTable=tbl=>{
    if(tbl.status==="occupied"){alert("Cannot delete occupied table. Clear it first.");return;}
    if(!window.confirm("Delete Table "+tbl.id+"? This cannot be undone."))return;
    setTables(ts=>ts.filter(t=>t!==tbl));
    if(tbl.dbId){
      dbDeleteTable(tbl.dbId).then(r=>{
        if(r.error)push({title:"Delete failed",body:r.error.message,color:"#dc2626"});
        else push({title:"Table deleted",body:"Table "+tbl.id,color:"#dc2626"});
      });
    }
  };
  var TABS=[["orders","Orders"],["analytics","Analytics"],["settings","Settings"],["menu","Menu"],["categories","Categories"],["combos","Set Meals"],["tables","Tables"],["stations","Stations"],["delivery","Delivery"],["codes","Promo Codes"],["autodisc","Auto Offers"],["cash","Cash"],["stock","Stock"],["discounts","Legacy Disc"],["hours","Hours"]];
  
  // ORDERS SEARCH & FILTERS - applied to fil (already branch-filtered orders)
  var searchedOrders=(()=>{
    var result=fil;
    // Text search across multiple fields
    var q=orderSearch.trim().toLowerCase();
    if(q){
      result=result.filter(o=>{
        var hay=[
          o.id,
          o.customer,
          o.phone,
          o.address?(typeof o.address==="string"?o.address:(o.address.line1||"")+" "+(o.address.postcode||"")):"",
          o.takenBy,
          (o.items||[]).map(i=>i.name).join(" "),
          o.deliveryCode,
          o.payMethod,
        ].filter(x=>x).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // Date filter
    if(orderDateFilter!=="all"){
      var now=new Date();
      var todayStr=now.toISOString().split("T")[0];
      var yesterday=new Date(now-86400000).toISOString().split("T")[0];
      var weekAgo=new Date(now-7*86400000).toISOString().split("T")[0];
      var monthAgo=new Date(now-30*86400000).toISOString().split("T")[0];
      result=result.filter(o=>{
        try{
          // Prefer created_at (full ISO timestamp) over time field (HH:MM only)
          var dateStr=o.created_at||o.time||"";
          if(!dateStr)return orderDateFilter==="today"; // assume today if no date info
          var d=new Date(dateStr);
          if(isNaN(d.getTime())){
            // If just HH:MM, treat as today (legacy data)
            if(/^\d{1,2}:\d{2}/.test(String(o.time||"")))return orderDateFilter==="today";
            return false;
          }
          var dStr=d.toISOString().split("T")[0];
          if(orderDateFilter==="today")return dStr===todayStr;
          if(orderDateFilter==="yesterday")return dStr===yesterday;
          if(orderDateFilter==="week")return dStr>=weekAgo;
          if(orderDateFilter==="month")return dStr>=monthAgo;
          if(orderDateFilter==="custom"){
            if(orderCustomFrom&&dStr<orderCustomFrom)return false;
            if(orderCustomTo&&dStr>orderCustomTo)return false;
            return true;
          }
        }catch(e){return false;}
        return true;
      });
    }
    // Type filter
    if(orderTypeFilter!=="all")result=result.filter(o=>o.type===orderTypeFilter);
    // Status filter
    if(orderStatusFilter!=="all")result=result.filter(o=>o.status===orderStatusFilter);
    // Source filter
    if(orderSourceFilter!=="all")result=result.filter(o=>o.source===orderSourceFilter);
    return result;
  })();
  return <div className="page">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}><div><h2 style={{fontSize:20,marginBottom:1}}>Admin Panel</h2><p style={{color:"#8a8078",fontSize:12}}>La Tavola Operations</p></div><select className="field" value={bf} onChange={e=>setBF(e.target.value)} style={{width:"auto",padding:"6px 10px",fontSize:12}}><option value="all">All Branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:12}}>{[["Revenue",fmt(rev),"#4a7155"],["Pending",fil.filter(o=>o.status==="pending").length,"#d97706"],["Preparing",fil.filter(o=>o.status==="preparing").length,"#2563eb"],["Ready",fil.filter(o=>o.status==="ready").length,"#059669"],["Total",fil.length,"#bf4626"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:11,padding:"10px 11px",border:"1px solid #ede8de"}}><div style={{fontSize:17,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600}}>{l}</div></div>)}</div>
    <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:12,paddingBottom:2}}>{TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"5px 11px",borderRadius:7,fontWeight:600,fontSize:11,whiteSpace:"nowrap",border:"2px solid",borderColor:tab===k?"#1a1208":(k==="settings"?"#7c3aed":"#ede8de"),background:tab===k?"#1a1208":(k==="settings"?"#f5f3ff":"#fff"),color:tab===k?"#fff":(k==="settings"?"#7c3aed":"#1a1208"),cursor:"pointer",flexShrink:0}}>{k==="settings"?String.fromCharCode(0x2699,0xFE0F)+" ":""}{l}</button>)}</div>
    {tab==="orders"&&<div>
      {/* Search Bar */}
      <div className="card" style={{marginBottom:10,padding:12}}>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:240,position:"relative"}}>
            <input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search by order#, name, phone, address, item, code..." className="field" style={{paddingLeft:34,paddingRight:orderSearch?32:10,fontSize:13}}/>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#8a8078",pointerEvents:"none"}}>{String.fromCharCode(0xD83D,0xDD0D)}</span>
            {orderSearch&&<button onClick={()=>setOrderSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"#ede8de",border:"none",width:22,height:22,borderRadius:11,cursor:"pointer",fontWeight:700,color:"#8a8078",fontSize:11}}>x</button>}
          </div>
          {(orderSearch||orderDateFilter!=="all"||orderTypeFilter!=="all"||orderStatusFilter!=="all"||orderSourceFilter!=="all")&&<button onClick={()=>{setOrderSearch("");setOrderDateFilter("all");setOrderTypeFilter("all");setOrderStatusFilter("all");setOrderSourceFilter("all");setOrderCustomFrom("");setOrderCustomTo("");}} style={{padding:"7px 12px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Clear All</button>}
        </div>

        {/* Filter chips */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>DATE</p>
            <select className="field" value={orderDateFilter} onChange={e=>setOrderDateFilter(e.target.value)} style={{fontSize:12,padding:"6px 8px"}}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>TYPE</p>
            <select className="field" value={orderTypeFilter} onChange={e=>setOrderTypeFilter(e.target.value)} style={{fontSize:12,padding:"6px 8px"}}>
              <option value="all">All types</option>
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
              <option value="collection">Collection</option>
              <option value="eatin">QR Eat-In</option>
            </select>
          </div>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>STATUS</p>
            <select className="field" value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)} style={{fontSize:12,padding:"6px 8px"}}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="collected">Collected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>SOURCE</p>
            <select className="field" value={orderSourceFilter} onChange={e=>setOrderSourceFilter(e.target.value)} style={{fontSize:12,padding:"6px 8px"}}>
              <option value="all">All sources</option>
              <option value="online">Customer Online</option>
              <option value="qr-table">QR Code Table</option>
              <option value="staff">Staff POS</option>
              <option value="phone">Phone Order</option>
            </select>
          </div>
        </div>

        {/* Custom date range */}
        {orderDateFilter==="custom"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:7}}>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>FROM</p>
            <input type="date" value={orderCustomFrom} onChange={e=>setOrderCustomFrom(e.target.value)} className="field" style={{fontSize:12,padding:"6px 8px"}}/>
          </div>
          <div>
            <p style={{fontSize:9,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3}}>TO</p>
            <input type="date" value={orderCustomTo} onChange={e=>setOrderCustomTo(e.target.value)} className="field" style={{fontSize:12,padding:"6px 8px"}}/>
          </div>
        </div>}

        {/* Result count */}
        <div style={{marginTop:9,padding:"7px 11px",background:"#f7f3ee",borderRadius:7,fontSize:11,color:"#8a8078",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span><strong style={{color:"#1a1208"}}>{searchedOrders.length}</strong> order{searchedOrders.length!==1?"s":""} found {fil.length!==searchedOrders.length?"(of "+fil.length+" total)":""}</span>
          {searchedOrders.length>0&&<span style={{fontWeight:700,color:"#bf4626"}}>Total: {fmt(searchedOrders.reduce((s,o)=>s+(parseFloat(o.total)||0),0))}</span>}
        </div>
      </div>

      {/* Order list */}
      {searchedOrders.length===0?<div className="card" style={{textAlign:"center",padding:40,color:"#8a8078"}}>
        <p style={{fontSize:36,marginBottom:9}}>{String.fromCharCode(0xD83D,0xDD0D)}</p>
        <p style={{fontSize:14,fontWeight:700,marginBottom:4}}>No orders found</p>
        <p style={{fontSize:12}}>Try adjusting your search or filters</p>
      </div>:allSt.map(st=>{
        var grp=searchedOrders.filter(o=>o.status===st);
        if(!grp.length)return null;
        return <div key={st} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span className="bdg" style={{background:SB[st],color:SC[st]}}>{SL[st]}</span>
            <span style={{color:"#8a8078",fontSize:11}}>{grp.length}</span>
          </div>
          <div className="ag">{grp.map(o=><div key={o.id} className="card" style={{padding:"11px 13px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,fontSize:13}}>{o.id}</p>
                <p style={{fontSize:10,color:"#8a8078"}}>{o.customer} - {(()=>{
                  try{
                    if(o.created_at){
                      var d=new Date(o.created_at);
                      if(!isNaN(d.getTime())){
                        var today=new Date().toISOString().split("T")[0];
                        var yest=new Date(Date.now()-86400000).toISOString().split("T")[0];
                        var dStr=d.toISOString().split("T")[0];
                        var tm=d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
                        if(dStr===today)return "Today "+tm;
                        if(dStr===yest)return "Yesterday "+tm;
                        return d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})+" "+tm;
                      }
                    }
                  }catch(e){}
                  return o.time||"";
                })()}</p>
                {o.phone&&<p style={{fontSize:10,color:"#8a8078"}}>{EM.phone} {o.phone}</p>}
                {o.address&&typeof o.address==="object"&&<p style={{fontSize:10,color:"#8a8078"}}>{EM.pin} {o.address.line1}, {o.address.postcode}</p>}
                <p style={{fontSize:9,color:"#8a8078",marginTop:2}}>
                  {o.source==="online"?String.fromCharCode(0xD83C,0xDF10)+" Online":""}
                  {o.source==="qr-table"?String.fromCharCode(0xD83D,0xDCF1)+" QR Table":""}
                  {o.source==="staff"?String.fromCharCode(0xD83D,0xDC68)+" Staff":""}
                  {o.source==="phone"?EM.phone+" Phone":""}
                  {" - "+(o.type||"")}
                  {o.takenBy?" - by "+o.takenBy:""}
                </p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontWeight:700,color:"#bf4626",fontSize:13}}>{fmt(o.total)}</p>
                <span style={{fontSize:10,color:o.paid?"#059669":"#dc2626",fontWeight:600}}>{o.paid?"Paid"+(o.payMethod?" "+o.payMethod:""):"Unpaid"}</span>
                {o.deliveryCode&&<p style={{fontSize:10,color:"#7c3aed",fontWeight:700,fontFamily:"'Courier New',monospace",marginTop:1}}>Code: {o.deliveryCode}</p>}
              </div>
            </div>
            <p style={{fontSize:11,color:"#8a8078",marginBottom:6}}>{(o.items||[]).map(i=>i.name+"x"+i.qty).join(", ")}</p>
            {o.notes&&<p style={{fontSize:10,color:"#92400e",background:"#fef3c7",padding:"4px 7px",borderRadius:5,marginBottom:6,fontStyle:"italic"}}>Note: {o.notes}</p>}
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {allSt.filter(s=>s!==o.status).map(s=><button key={s} onClick={()=>upSt(o.id,s)} style={{padding:"2px 6px",borderRadius:5,fontSize:10,fontWeight:600,border:"1px solid "+SC[s],color:SC[s],background:SB[s],cursor:"pointer"}}>{SL[s]}</button>)}
            </div>
            <button onClick={()=>printR(o,branches.find(b=>b.id===o.branchId))} style={{fontSize:10,color:"#8a8078",border:"none",background:"none",cursor:"pointer",marginTop:4}}>Print Receipt</button>
          </div>)}</div>
        </div>;
      })}
    </div>}
    {tab==="analytics"&&<div className="g2"><div className="card"><h3 style={{fontSize:15,marginBottom:10}}>Revenue</h3><p style={{fontSize:26,fontWeight:700,color:"#bf4626"}}>{fmt(rev)}</p><p style={{fontSize:12,color:"#8a8078",marginTop:4}}>Avg: {fmt(del.length?rev/del.length:0)}</p></div><div className="card"><h3 style={{fontSize:15,marginBottom:10}}>Order Types</h3>{[["Dine In","dine-in"],["Takeaway","takeaway"],["Collection","collection"]].map(([l,t])=>{var c=fil.filter(o=>o.type===t).length;return <div key={t} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{fontWeight:600}}>{l}</span><span style={{color:"#8a8078"}}>{c}</span></div><div style={{height:4,background:"#f7f3ee",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:"#bf4626",width:Math.max(fil.length,1)?Math.round((c/Math.max(fil.length,1))*100)+"%":"0%",borderRadius:2}}/></div></div>;})}</div></div>}
    {tab==="menu"&&(()=>{
      // Apply filters
      var q=menuSearch.trim().toLowerCase();
      var filtered=menu.filter(item=>{
        if(menuFilterCat!=="all"&&item.cat!==menuFilterCat)return false;
        if(menuFilterStation!=="all"){
          if(menuFilterStation==="none"&&item.station)return false;
          else if(menuFilterStation!=="none"&&item.station!==menuFilterStation)return false;
        }
        if(menuFilterStatus==="available"&&!item.avail)return false;
        if(menuFilterStatus==="unavailable"&&item.avail)return false;
        if(menuFilterStatus==="lowstock"&&(item.stock>5||item.stock===0))return false;
        if(menuFilterStatus==="soldout"&&item.stock!==0)return false;
        if(q){
          var hay=(item.name+" "+(item.desc||"")+" "+(item.cat||"")).toLowerCase();
          if(!hay.includes(q))return false;
        }
        return true;
      });
      // Apply sort
      filtered=[...filtered].sort((a,b)=>{
        if(menuSort==="az")return a.name.localeCompare(b.name);
        if(menuSort==="za")return b.name.localeCompare(a.name);
        if(menuSort==="cheap")return (+a.price||0)-(+b.price||0);
        if(menuSort==="expensive")return (+b.price||0)-(+a.price||0);
        if(menuSort==="cat")return (a.cat||"").localeCompare(b.cat||"")||a.name.localeCompare(b.name);
        return 0;
      });

      // Highlight match in name
      var hl=(text)=>{
        if(!q||!text)return text;
        var idx=text.toLowerCase().indexOf(q);
        if(idx<0)return text;
        return <>{text.slice(0,idx)}<mark style={{background:"#fef3c7",padding:0}}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>;
      };

      var hasActiveFilter=q||menuFilterCat!=="all"||menuFilterStation!=="all"||menuFilterStatus!=="all";
      return <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div><h3 style={{fontSize:16}}>Menu Items <span style={{color:"#8a8078",fontWeight:400}}>({filtered.length}{filtered.length!==menu.length?" of "+menu.length:""})</span></h3><p style={{fontSize:11,color:"#8a8078"}}>Tap a card to edit, or add new items</p></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>setShowImport(true)} style={{padding:"8px 14px",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:9,cursor:"pointer"}}>{EM.party} Import with AI</button>
            <button className="btn btn-r" onClick={()=>setEditItem({})} style={{padding:"8px 16px",fontSize:13}}>+ Add New Item</button>
          </div>
        </div>

        <div className="card" style={{padding:12,marginBottom:12}}>
          <div style={{position:"relative",marginBottom:8}}>
            <input value={menuSearch} onChange={e=>setMenuSearch(e.target.value)} placeholder="Search by name, description, or category..." className="field" style={{paddingLeft:36,paddingRight:menuSearch?36:12,fontSize:13}}/>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#8a8078",pointerEvents:"none"}}>{String.fromCharCode(0x1F50D >> 10) + String.fromCharCode(0x1F50D & 0x3FF)}</span>
            {menuSearch&&<button onClick={()=>setMenuSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"#ede8de",border:"none",width:24,height:24,borderRadius:12,cursor:"pointer",fontWeight:700,color:"#8a8078"}}>x</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6}}>
            <select value={menuSort} onChange={e=>setMenuSort(e.target.value)} className="field" style={{fontSize:12}}>
              <option value="az">Sort: A to Z</option>
              <option value="za">Sort: Z to A</option>
              <option value="cat">Sort: by Category</option>
              <option value="cheap">Sort: Price low-high</option>
              <option value="expensive">Sort: Price high-low</option>
            </select>
            <select value={menuFilterCat} onChange={e=>setMenuFilterCat(e.target.value)} className="field" style={{fontSize:12}}>
              <option value="all">All Categories</option>
              {[...new Set(menu.map(m=>m.cat).filter(Boolean))].sort().map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={menuFilterStation} onChange={e=>setMenuFilterStation(e.target.value)} className="field" style={{fontSize:12}}>
              <option value="all">All Stations</option>
              <option value="none">No Station Set</option>
              {(stations||[]).filter(s=>s.active!==false).map(s=><option key={s.dbId} value={s.name}>{s.name}</option>)}
            </select>
            <select value={menuFilterStatus} onChange={e=>setMenuFilterStatus(e.target.value)} className="field" style={{fontSize:12}}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable (86'd)</option>
              <option value="lowstock">Low Stock (1-5)</option>
              <option value="soldout">Sold Out (0)</option>
            </select>
          </div>
          {hasActiveFilter&&<button onClick={()=>{setMenuSearch("");setMenuFilterCat("all");setMenuFilterStation("all");setMenuFilterStatus("all");}} style={{marginTop:8,padding:"6px 11px",fontSize:11,fontWeight:700,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,cursor:"pointer"}}>Clear all filters</button>}
        </div>

        {filtered.length===0?<div className="card" style={{textAlign:"center",padding:40}}>
          <p style={{fontSize:36,marginBottom:9}}>{EM.cross}</p>
          <p style={{fontSize:14,fontWeight:700,marginBottom:4}}>No items match your search</p>
          <p style={{fontSize:12,color:"#8a8078",marginBottom:11}}>Try a different search or clear filters</p>
          {hasActiveFilter&&<button onClick={()=>{setMenuSearch("");setMenuFilterCat("all");setMenuFilterStation("all");setMenuFilterStatus("all");}} className="btn btn-r" style={{padding:"8px 16px",fontSize:12}}>Clear All Filters</button>}
        </div>:<div className="ag">{filtered.map(item=><div key={item.id} className="card" style={{opacity:item.avail?1:.5,cursor:"pointer",transition:"transform .15s"}} onClick={()=>setEditItem(item)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:26}}>{EM[item.icon]||""}</span><span style={{fontWeight:700,color:"#bf4626"}}>{fmt(item.price)}</span></div>
          <p style={{fontWeight:700,fontSize:13,marginBottom:1}}>{hl(item.name)}</p>
          <p style={{fontSize:10,color:"#8a8078",marginBottom:6}}>{item.cat}{item.station?" - "+item.station:""} - Stock: {item.stock}</p>
          {item.allergens&&item.allergens.length>0&&<p style={{fontSize:9,color:"#7c3aed",marginBottom:6,fontWeight:600}}>{item.allergens.length} dietary tag{item.allergens.length>1?"s":""}</p>}
          <div style={{display:"flex",gap:4}}>
            <button onClick={e=>{e.stopPropagation();setMenu(ms=>ms.map(m=>m.id===item.id?{...m,avail:!m.avail}:m));}} style={{flex:1,padding:"6px",borderRadius:7,fontWeight:600,fontSize:11,border:"2px solid",borderColor:item.avail?"#059669":"#ede8de",background:item.avail?"#d1fae5":"#f7f3ee",color:item.avail?"#065f46":"#8a8078",cursor:"pointer"}}>{item.avail?"Available":"86'd"}</button>
            <button onClick={e=>{e.stopPropagation();setEditItem(item);}} style={{padding:"6px 10px",borderRadius:7,background:"#1a1208",color:"#fff",border:"none",fontWeight:700,fontSize:11,cursor:"pointer"}}>Edit</button>
          </div>
        </div>)}</div>}
      </div>;
    })()}

    {tab==="combos"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div><h3 style={{fontSize:16}}>Set Meals & Combos ({setMeals.length})</h3><p style={{fontSize:11,color:"#8a8078"}}>Bundle items at a discounted price</p></div>
        <button className="btn btn-p" onClick={()=>setEditMeal({})} style={{padding:"8px 16px",fontSize:13}}>+ Create Combo</button>
      </div>
      {setMeals.length===0&&<div className="card" style={{textAlign:"center",padding:30,color:"#8a8078"}}><p style={{fontSize:14,marginBottom:4}}>No set meals yet</p><p style={{fontSize:12}}>Create combos to increase average order value</p></div>}
      <div className="ag">{setMeals.map(sm=>{
        var items=sm.itemIds.map(id=>menu.find(m=>m.id===id)).filter(Boolean);
        var reg=items.reduce((s,i)=>s+i.price,0), save=reg-sm.price;
        return <div key={sm.id} className="card" style={{opacity:sm.avail?1:.5,cursor:"pointer",borderLeft:"4px solid #7c3aed",transition:"transform .15s"}} onClick={()=>setEditMeal(sm)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:26}}>{EM[sm.icon]||""}</span><div style={{textAlign:"right"}}><span style={{fontWeight:700,color:"#7c3aed",fontSize:14}}>{fmt(sm.price)}</span>{save>0&&<p style={{fontSize:10,color:"#059669",fontWeight:700}}>Save {fmt(save)}</p>}</div></div>
          <p style={{fontWeight:700,fontSize:13,marginBottom:2}}>{sm.name}</p>
          <p style={{fontSize:11,color:"#8a8078",marginBottom:6,lineHeight:1.4}}>{sm.desc}</p>
          <div style={{padding:"6px 8px",background:"#f5f0ff",borderRadius:6,marginBottom:8}}>
            {items.map(i=><div key={i.id} style={{fontSize:11,color:"#1a1208",display:"flex",gap:6,marginBottom:2}}><span>{EM[i.icon]||""}</span><span>{i.name}</span></div>)}
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={e=>{e.stopPropagation();setSetMeals(ms=>ms.map(m=>m.id===sm.id?{...m,avail:!m.avail}:m));}} style={{flex:1,padding:"6px",borderRadius:7,fontWeight:600,fontSize:11,border:"2px solid",borderColor:sm.avail?"#059669":"#ede8de",background:sm.avail?"#d1fae5":"#f7f3ee",color:sm.avail?"#065f46":"#8a8078",cursor:"pointer"}}>{sm.avail?"Active":"Inactive"}</button>
            <button onClick={e=>{e.stopPropagation();setEditMeal(sm);}} style={{padding:"6px 10px",borderRadius:7,background:"#7c3aed",color:"#fff",border:"none",fontWeight:700,fontSize:11,cursor:"pointer"}}>Edit</button>
          </div>
        </div>;
      })}</div>
    </div>}

    {tab==="categories"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div><h3 style={{fontSize:16}}>Menu Categories ({categories.length})</h3><p style={{fontSize:11,color:"#8a8078"}}>Organize your menu into sections</p></div>
        <button className="btn btn-r" onClick={()=>setEditCat({})} style={{padding:"8px 16px",fontSize:13}}>+ Add Category</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {categories.slice().sort((a,b)=>a.order-b.order).map(c=>{
          var count=menu.filter(m=>m.cat===c.name).length;
          return <div key={c.id} className="card" style={{cursor:"pointer",borderLeft:"4px solid #d4952a",transition:"transform .15s"}} onClick={()=>setEditCat(c)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:28}}>{EM[c.icon]||""}</span>
              <span style={{fontSize:10,background:"#f7f3ee",padding:"2px 8px",borderRadius:10,color:"#8a8078",fontWeight:700}}>#{c.order}</span>
            </div>
            <p style={{fontWeight:700,fontSize:15,marginBottom:2}}>{c.name}</p>
            <p style={{fontSize:11,color:"#8a8078"}}>{count} item{count!==1?"s":""}</p>
          </div>;
        })}
      </div>
    </div>}

    {editItem&&<MenuEditor item={editItem} onSave={saveItem} onClose={()=>setEditItem(null)} onDelete={deleteItem} modifiers={MODIFIERS0} categories={categories} stations={stations}/>}
    {editMeal&&<SetMealEditor meal={editMeal} menu={menu} onSave={saveMeal} onClose={()=>setEditMeal(null)} onDelete={deleteMeal}/>}
    {editCat&&<CategoryEditor cat={editCat} onSave={saveCat} onClose={()=>setEditCat(null)} onDelete={deleteCat} menu={menu}/>}
    {showImport&&<MenuImportModal onClose={()=>setShowImport(false)} onImport={bulkImport} categories={categories}/>}
    {editTable&&<TableEditor table={editTable} onSave={saveTable} onClose={()=>setEditTable(null)} existingTables={tables.filter(t=>t.branchId===adminBranch)}/>}
    {editCode&&<div onClick={()=>setEditCode(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:460,padding:22,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:20}}>{editCode.dbId?"Edit Code":"Create Promo Code"}</h2>
          <button onClick={()=>setEditCode(null)} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
        </div>
        <div style={{marginBottom:10}}><label className="lbl">Code (customers type this)</label><input className="field" value={editCode.code||""} onChange={e=>setEditCode({...editCode,code:e.target.value.toUpperCase()})} placeholder="WELCOME10" style={{fontWeight:700,letterSpacing:1}}/></div>
        <div style={{marginBottom:10}}>
          <label className="lbl">Discount Type</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {[["percent","% off"],["fixed",EM.pound+" off"],["free_delivery","Free delivery"]].map(([k,l])=><button key={k} onClick={()=>setEditCode({...editCode,type:k})} style={{padding:"10px 4px",fontSize:12,fontWeight:700,background:editCode.type===k?"#bf4626":"#fff",color:editCode.type===k?"#fff":"#1a1208",border:"2px solid "+(editCode.type===k?"#bf4626":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{l}</button>)}
          </div>
        </div>
        {editCode.type!=="free_delivery"&&<div style={{marginBottom:10}}><label className="lbl">{editCode.type==="percent"?"Percentage":"Amount"}</label><input type="number" step="0.01" className="field" value={editCode.value||""} onChange={e=>setEditCode({...editCode,value:+e.target.value})}/></div>}
        <div style={{marginBottom:10}}><label className="lbl">Description (shown to customer)</label><input className="field" value={editCode.description||""} onChange={e=>setEditCode({...editCode,description:e.target.value})} placeholder="10% off your first order"/></div>
        <div className="g2" style={{marginBottom:10}}>
          <div><label className="lbl">Min order {EM.pound}</label><input type="number" step="0.01" className="field" value={editCode.minOrder||0} onChange={e=>setEditCode({...editCode,minOrder:+e.target.value})}/></div>
          <div><label className="lbl">Max uses</label><input type="number" className="field" value={editCode.maxUses||100} onChange={e=>setEditCode({...editCode,maxUses:+e.target.value})}/></div>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"}}>
          <input type="checkbox" checked={editCode.firstOrderOnly||false} onChange={e=>setEditCode({...editCode,firstOrderOnly:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontSize:13}}>First order only</span>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={editCode.active!==false} onChange={e=>setEditCode({...editCode,active:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontSize:13,fontWeight:700}}>Active</span>
        </label>
        <div style={{display:"flex",gap:7}}>
          <button className="btn btn-o" onClick={()=>setEditCode(null)} style={{flex:1,padding:"11px"}}>Cancel</button>
          <button className="btn btn-r" onClick={()=>{
            if(!editCode.code){alert("Code required");return;}
            dbSaveCode(editCode).then(r=>{
              if(r.error){push({title:"Save failed",body:r.error.message,color:"#dc2626"});return;}
              var saved={...editCode,dbId:r.data?.id||editCode.dbId};
              setPromoCodes(cs=>editCode.dbId?cs.map(x=>x.dbId===editCode.dbId?saved:x):[...cs,saved]);
              push({title:"Code saved",body:editCode.code,color:"#059669"});
              setEditCode(null);
            });
          }} style={{flex:2,padding:"11px"}}>Save Code</button>
        </div>
      </div>
    </div>}
    {editStation&&<div onClick={()=>setEditStation(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:540,padding:22,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:20}}>{editStation.dbId?"Edit Station":"New Station"}</h2>
          <button onClick={()=>setEditStation(null)} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
        </div>
        <div className="g2" style={{marginBottom:10}}>
          <div><label className="lbl">Station Name</label><input className="field" value={editStation.name||""} onChange={e=>setEditStation({...editStation,name:e.target.value})} placeholder="Tandoor"/></div>
          <div><label className="lbl">Color</label><div style={{display:"flex",gap:5}}>
            <input type="color" value={editStation.color||"#bf4626"} onChange={e=>setEditStation({...editStation,color:e.target.value})} style={{width:46,height:38,border:"2px solid #ede8de",borderRadius:7,cursor:"pointer"}}/>
            <input className="field" value={editStation.color||""} onChange={e=>setEditStation({...editStation,color:e.target.value})} placeholder="#bf4626" style={{flex:1}}/>
          </div></div>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={editStation.active!==false} onChange={e=>setEditStation({...editStation,active:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontWeight:700}}>Active</span>
        </label>

        <div style={{padding:"11px 13px",background:"#fafaf5",borderRadius:9,marginBottom:10}}>
          <p style={{fontWeight:700,fontSize:13,marginBottom:8}}>Printer Setup</p>
          <label className="lbl">Print Method</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:9}}>
            {[["none","No Printer"],["browser","Browser Print"],["printnode","PrintNode (auto)"]].map(([k,l])=><button key={k} onClick={()=>setEditStation({...editStation,printerMethod:k})} style={{padding:"9px 4px",fontSize:11,fontWeight:700,background:editStation.printerMethod===k?"#bf4626":"#fff",color:editStation.printerMethod===k?"#fff":"#1a1208",border:"2px solid "+(editStation.printerMethod===k?"#bf4626":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{l}</button>)}
          </div>

          {editStation.printerMethod&&editStation.printerMethod!=="none"&&<>
            <label className="lbl">Paper Format</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:9}}>
              {[["thermal","Thermal 80mm"],["a4","A4 Standard"]].map(([k,l])=><button key={k} onClick={()=>setEditStation({...editStation,printerFormat:k})} style={{padding:"9px 4px",fontSize:11,fontWeight:700,background:editStation.printerFormat===k?"#7c3aed":"#fff",color:editStation.printerFormat===k?"#fff":"#1a1208",border:"2px solid "+(editStation.printerFormat===k?"#7c3aed":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{l}</button>)}
            </div>

            <label className="lbl">What to print</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:5,marginBottom:9}}>
              {[["station_only","Only this station's items"],["full_order","Full order (all items)"],["station_with_full_summary","Station items + summary of full order"]].map(([k,l])=><button key={k} onClick={()=>setEditStation({...editStation,printContent:k})} style={{padding:"8px 10px",fontSize:11,fontWeight:700,background:editStation.printContent===k?"#1a1208":"#fff",color:editStation.printContent===k?"#fff":"#1a1208",border:"2px solid "+(editStation.printContent===k?"#1a1208":"#ede8de"),borderRadius:7,cursor:"pointer",textAlign:"left"}}>{l}</button>)}
            </div>

            <div className="g2" style={{marginBottom:9}}>
              <div><label className="lbl">Copies</label><input type="number" min="1" max="5" className="field" value={editStation.copies||1} onChange={e=>setEditStation({...editStation,copies:+e.target.value})}/></div>
              <div>
                <label className="lbl">Auto-print</label>
                <button onClick={()=>setEditStation({...editStation,autoPrint:!editStation.autoPrint})} style={{width:"100%",padding:"9px",fontSize:12,fontWeight:700,background:editStation.autoPrint?"#059669":"#fff",color:editStation.autoPrint?"#fff":"#1a1208",border:"2px solid "+(editStation.autoPrint?"#059669":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{editStation.autoPrint?"ON - Print on accept":"OFF - Manual print"}</button>
              </div>
            </div>

            {editStation.printerMethod==="printnode"&&<div>
              <label className="lbl">PrintNode Printer ID</label>
              <input className="field" value={editStation.printnodeId||""} onChange={e=>setEditStation({...editStation,printnodeId:e.target.value})} placeholder="123456 (find in printnode.com dashboard)"/>
              <p style={{fontSize:10,color:"#8a8078",marginTop:4}}>API key set globally in Stations tab. Direct browser calls may fail due to CORS - production should proxy via server.</p>
            </div>}
          </>}
        </div>

        <div style={{display:"flex",gap:7}}>
          <button className="btn btn-o" onClick={()=>setEditStation(null)} style={{flex:1,padding:"11px"}}>Cancel</button>
          <button className="btn btn-r" onClick={()=>{
            if(!editStation.name){alert("Name required");return;}
            dbSaveStation(editStation).then(r=>{
              if(r.error){push({title:"Save failed",body:r.error.message,color:"#dc2626"});return;}
              var saved={...editStation,dbId:r.data?.id||editStation.dbId};
              setStations(ls=>editStation.dbId?ls.map(x=>x.dbId===editStation.dbId?saved:x):[...(ls||[]),saved]);
              push({title:"Station saved",body:editStation.name,color:"#059669"});
              setEditStation(null);
            });
          }} style={{flex:2,padding:"11px"}}>Save Station</button>
        </div>
      </div>
    </div>}

    {editAuto&&<div onClick={()=>setEditAuto(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:460,padding:22,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:20}}>{editAuto.dbId?"Edit Offer":"Create Auto Offer"}</h2>
          <button onClick={()=>setEditAuto(null)} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
        </div>
        <div style={{marginBottom:10}}><label className="lbl">Offer Name</label><input className="field" value={editAuto.name||""} onChange={e=>setEditAuto({...editAuto,name:e.target.value})} placeholder="10% off \u00A330+"/></div>
        <div style={{marginBottom:10}}><label className="lbl">Description</label><input className="field" value={editAuto.description||""} onChange={e=>setEditAuto({...editAuto,description:e.target.value})} placeholder="Shown to customer at checkout"/></div>
        <div style={{marginBottom:10}}><label className="lbl">Minimum order to trigger {EM.pound}</label><input type="number" step="0.01" className="field" value={editAuto.minOrder||0} onChange={e=>setEditAuto({...editAuto,minOrder:+e.target.value})}/></div>
        <div style={{marginBottom:10}}>
          <label className="lbl">Discount Type</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {[["percent","% off"],["fixed",EM.pound+" off"],["free_delivery","Free delivery"]].map(([k,l])=><button key={k} onClick={()=>setEditAuto({...editAuto,discountType:k})} style={{padding:"10px 4px",fontSize:12,fontWeight:700,background:editAuto.discountType===k?"#7c3aed":"#fff",color:editAuto.discountType===k?"#fff":"#1a1208",border:"2px solid "+(editAuto.discountType===k?"#7c3aed":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{l}</button>)}
          </div>
        </div>
        {editAuto.discountType!=="free_delivery"&&<div style={{marginBottom:10}}><label className="lbl">{editAuto.discountType==="percent"?"Percentage %":"Amount "+EM.pound}</label><input type="number" step="0.01" className="field" value={editAuto.discountValue||0} onChange={e=>setEditAuto({...editAuto,discountValue:+e.target.value})}/></div>}
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"}}>
          <input type="checkbox" checked={editAuto.firstOrderOnly||false} onChange={e=>setEditAuto({...editAuto,firstOrderOnly:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontSize:13}}>First order only</span>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={editAuto.active!==false} onChange={e=>setEditAuto({...editAuto,active:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
          <span style={{fontSize:13,fontWeight:700}}>Active</span>
        </label>
        <div style={{display:"flex",gap:7}}>
          <button className="btn btn-o" onClick={()=>setEditAuto(null)} style={{flex:1,padding:"11px"}}>Cancel</button>
          <button className="btn btn-r" onClick={()=>{
            if(!editAuto.name){alert("Name required");return;}
            dbSaveAutoDiscount(editAuto).then(r=>{
              if(r.error){push({title:"Save failed",body:r.error.message,color:"#dc2626"});return;}
              var saved={...editAuto,dbId:r.data?.id||editAuto.dbId};
              setAutoDiscs(ls=>editAuto.dbId?ls.map(x=>x.dbId===editAuto.dbId?saved:x):[...ls,saved]);
              push({title:"Offer saved",body:editAuto.name,color:"#059669"});
              setEditAuto(null);
            });
          }} style={{flex:2,padding:"11px"}}>Save Offer</button>
        </div>
      </div>
    </div>}
    {tab==="tables"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div>
          <h3 style={{fontSize:16,marginBottom:2}}>Tables Management</h3>
          <p style={{fontSize:11,color:"#8a8078"}}>Manage tables for each branch independently</p>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <select value={adminBranch} onChange={e=>setAdminBranch(e.target.value)} style={{padding:"7px 10px",fontSize:12,border:"2px solid #ede8de",borderRadius:8,fontWeight:700,cursor:"pointer"}}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <button onClick={()=>{
            var branchTables=tables.filter(t=>t.branchId===adminBranch).sort((a,b)=>(+a.id)-(+b.id));
            if(branchTables.length===0){alert("No tables for this branch yet. Add tables first.");return;}
            var baseUrl=window.location.origin+window.location.pathname;
            var win=window.open("","","width=900,height=700");
            if(!win){alert("Please allow pop-ups to print QR codes");return;}
            var cards=branchTables.map(t=>{
              var url=baseUrl+"?branch="+adminBranch+"&table="+t.id;
              var qrImgUrl="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(url);
              return "<div style='border:2px dashed #8a8078;border-radius:14px;padding:20px 16px;text-align:center;page-break-inside:avoid;margin:8px;width:280px;display:inline-block;vertical-align:top;background:#fff'><div style='font-size:12px;color:#8a8078;letter-spacing:2px;margin-bottom:4px'>LA TAVOLA</div><div style='font-size:14px;color:#666;margin-bottom:14px'>"+(branches.find(b=>b.id===adminBranch)||{}).name+"</div><div style='font-size:42px;font-weight:bold;color:#bf4626;margin-bottom:14px'>TABLE "+t.id+"</div><img src='"+qrImgUrl+"' style='width:220px;height:220px'/><p style='font-size:13px;color:#333;margin-top:14px;font-weight:600'>Scan to order</p><p style='font-size:10px;color:#8a8078;margin-top:4px;word-break:break-all'>"+url+"</p></div>";
            }).join("");
            win.document.write("<html><head><title>QR Codes - "+(branches.find(b=>b.id===adminBranch)||{}).name+"</title><style>body{font-family:system-ui,sans-serif;padding:20px;background:#f5f5f5}h1{text-align:center;margin-bottom:20px}.print-hint{text-align:center;color:#666;margin-bottom:20px}@media print{body{background:#fff;padding:0}.print-hint{display:none}}</style></head><body><h1>QR Codes - Stick on Tables</h1><p class='print-hint'>Use Cmd/Ctrl+P to print. Stick each QR code on its corresponding table.</p>"+cards+"</body></html>");
            win.document.close();
          }} style={{padding:"7px 14px",fontSize:12,fontWeight:700,background:"#1a1208",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Print QR Codes</button>
          <button className="btn btn-r" onClick={()=>{var tbs=tables.filter(t=>t.branchId===adminBranch);var nextNum=tbs.length>0?Math.max(...tbs.map(t=>+t.id||0))+1:1;setEditTable({id:nextNum,seats:4,x:20,y:20});}} style={{padding:"7px 14px",fontSize:12}}>+ Add Table</button>
        </div>
      </div>
      {(()=>{var branchTables=tables.filter(t=>t.branchId===adminBranch);var totalSeats=branchTables.reduce((s,t)=>s+t.seats,0);return <>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
          <div style={{background:"#fff",borderRadius:9,padding:"9px 8px",border:"1px solid #ede8de",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#1a1208"}}>{branchTables.length}</div><div style={{fontSize:10,color:"#8a8078"}}>Tables</div></div>
          <div style={{background:"#fff",borderRadius:9,padding:"9px 8px",border:"1px solid #ede8de",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#bf4626"}}>{totalSeats}</div><div style={{fontSize:10,color:"#8a8078"}}>Total Seats</div></div>
          <div style={{background:"#fff",borderRadius:9,padding:"9px 8px",border:"1px solid #ede8de",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#059669"}}>{branchTables.filter(t=>t.status==="free").length}</div><div style={{fontSize:10,color:"#8a8078"}}>Available</div></div>
        </div>
        {branchTables.length===0?<div className="card" style={{textAlign:"center",padding:30}}><p style={{fontSize:40,marginBottom:10}}>{EM.cart}</p><p style={{fontSize:14,color:"#8a8078",marginBottom:10}}>No tables yet for this branch</p><button className="btn btn-r" onClick={()=>setEditTable({id:1,seats:4,x:20,y:20})} style={{padding:"9px 18px"}}>Add First Table</button></div>:
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
          {branchTables.sort((a,b)=>(+a.id)-(+b.id)).map(tbl=>{
            var statusColor=tbl.status==="occupied"?"#dc2626":tbl.status==="reserved"?"#d4952a":"#059669";
            return <div key={(tbl.dbId||tbl.id)+"_"+tbl.id} className="card" style={{padding:12,borderLeft:"4px solid "+statusColor}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><p style={{fontWeight:700,fontSize:18}}>Table {tbl.id}</p><p style={{fontSize:11,color:"#8a8078"}}>{tbl.seats} seats - <span style={{color:statusColor,fontWeight:700,textTransform:"capitalize"}}>{tbl.status||"free"}</span></p></div>
              </div>
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>setEditTable(tbl)} style={{flex:1,padding:"6px",fontSize:11,background:"#f7f3ee",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>Edit</button>
                <button onClick={()=>deleteTable(tbl)} style={{padding:"6px 10px",fontSize:11,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>x</button>
              </div>
            </div>;
          })}
        </div>}
      </>})()}
    </div>}
    {tab==="cash"&&(()=>{
      // Find all delivered orders with cash collected but not yet handed over
      var unsettled=orders.filter(o=>{
        if(branch&&o.branchId&&o.branchId!==branch.id)return false;
        return o.type==="delivery"&&o.status==="delivered"&&o.payMethod==="cash"&&o.paid&&!o.cashHandoverId;
      });
      // Group by driver
      var byDriver={};
      unsettled.forEach(o=>{
        var d=o.deliveredBy||"Unknown";
        if(!byDriver[d])byDriver[d]={driver:d,orders:[],total:0};
        byDriver[d].orders.push(o);
        byDriver[d].total+=parseFloat(o.cashCollected||o.total||0);
      });
      var driverList=Object.values(byDriver);

      var doHandover=(group)=>{
        var amt=parseFloat(handoverAmount||group.total);
        if(!amt||amt<=0){alert("Enter cash amount received");return;}
        var orderIds=group.orders.map(o=>o.id);
        var handover={branchId:branch?.id,driverName:group.driver,managerName:user?.name||"Manager",amount:amt,expectedAmount:group.total,orderIds:orderIds};
        dbRecordHandover(handover).then(r=>{
          if(r.error){push({title:"Save failed",body:r.error.message,color:"#dc2626"});return;}
          // Update local orders to mark as handed over
          setOrders(os=>os.map(o=>orderIds.includes(o.id)?{...o,cashHandoverId:r.data?.id||"local"}:o));
          // Refresh handover list
          dbFetchHandovers().then(list=>setCashHandovers(list||[]));
          var diff=amt-group.total;
          var msg=diff===0?"Exact":(diff>0?"Over by "+fmt(diff):"Short by "+fmt(Math.abs(diff)));
          push({title:"Cash received from "+group.driver,body:fmt(amt)+" - "+msg,color:diff===0?"#059669":"#d4952a"});
          setHandoverAmount("");setHandoverDriver("");
        });
      };

      return <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div><h3 style={{fontSize:16,marginBottom:2}}>Cash Reconciliation</h3><p style={{fontSize:11,color:"#8a8078"}}>Receive cash from drivers - {branch?.name}</p></div>
          <select value={adminBranch} onChange={e=>setAdminBranch(e.target.value)} style={{padding:"7px 10px",fontSize:12,border:"2px solid #ede8de",borderRadius:8,fontWeight:700,cursor:"pointer"}}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginBottom:14}}>
          <div className="card" style={{padding:13,textAlign:"center",background:"#fef3c7"}}>
            <p style={{fontSize:11,color:"#92400e",fontWeight:700}}>OUTSTANDING</p>
            <p style={{fontSize:24,fontWeight:700,color:"#92400e"}}>{fmt(unsettled.reduce((s,o)=>s+(o.cashCollected||o.total||0),0))}</p>
            <p style={{fontSize:10,color:"#92400e"}}>{unsettled.length} orders awaiting handover</p>
          </div>
          <div className="card" style={{padding:13,textAlign:"center",background:"#d1fae5"}}>
            <p style={{fontSize:11,color:"#065f46",fontWeight:700}}>RECEIVED TODAY</p>
            <p style={{fontSize:24,fontWeight:700,color:"#065f46"}}>{fmt(cashHandovers.filter(h=>{var d=new Date(h.created_at);return d.toDateString()===new Date().toDateString();}).reduce((s,h)=>s+parseFloat(h.amount||0),0))}</p>
            <p style={{fontSize:10,color:"#065f46"}}>{cashHandovers.filter(h=>{var d=new Date(h.created_at);return d.toDateString()===new Date().toDateString();}).length} handovers today</p>
          </div>
        </div>

        <h4 style={{fontSize:13,fontWeight:700,marginBottom:8,color:"#8a8078",letterSpacing:1}}>DRIVERS WITH CASH OWED</h4>
        {driverList.length===0?<div className="card" style={{textAlign:"center",padding:24}}>
          <p style={{fontSize:30,marginBottom:6}}>{EM.check}</p>
          <p style={{fontSize:13,color:"#8a8078"}}>All cash reconciled - no drivers owe money</p>
        </div>:driverList.map(g=><div key={g.driver} className="card" style={{padding:14,marginBottom:9,borderLeft:"4px solid #f59e0b"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9,flexWrap:"wrap",gap:6}}>
            <div>
              <p style={{fontWeight:700,fontSize:15}}>{g.driver}</p>
              <p style={{fontSize:11,color:"#8a8078"}}>{g.orders.length} delivered orders - cash to collect</p>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:"#bf4626"}}>{fmt(g.total)}</p>
          </div>
          <details style={{marginBottom:9}}>
            <summary style={{cursor:"pointer",fontSize:11,color:"#8a8078",fontWeight:700}}>Show {g.orders.length} order{g.orders.length!==1?"s":""}</summary>
            <div style={{marginTop:7,background:"#fafaf5",borderRadius:6,padding:"7px 10px",fontSize:11}}>
              {g.orders.map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span>{o.id} - {o.customer}</span><span style={{fontWeight:700}}>{fmt(o.cashCollected||o.total)}</span></div>)}
            </div>
          </details>
          <div style={{padding:"10px 12px",background:"#fffbeb",borderRadius:8,border:"2px solid #fde68a"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:7}}>Receive cash from {g.driver}</p>
            <div style={{display:"flex",gap:6}}>
              <input type="number" step="0.01" value={handoverDriver===g.driver?handoverAmount:""} onFocus={()=>setHandoverDriver(g.driver)} onChange={e=>{setHandoverDriver(g.driver);setHandoverAmount(e.target.value);}} placeholder={fmt(g.total)} style={{flex:1,padding:"10px",fontSize:14,fontWeight:700,textAlign:"center",border:"2px solid #f59e0b",borderRadius:7}}/>
              <button onClick={()=>doHandover(g)} style={{padding:"10px 14px",background:"#059669",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:13}}>{EM.check} Confirm Received</button>
            </div>
            <p style={{fontSize:10,color:"#92400e",marginTop:5}}>Tip: leave blank to confirm exact expected amount</p>
          </div>
        </div>)}

        <h4 style={{fontSize:13,fontWeight:700,marginTop:18,marginBottom:8,color:"#8a8078",letterSpacing:1}}>RECENT HANDOVER HISTORY</h4>
        {cashHandovers.length===0?<p style={{fontSize:12,color:"#8a8078",fontStyle:"italic"}}>No handovers recorded yet</p>:<div style={{display:"grid",gap:6}}>
          {cashHandovers.slice(0,15).map(h=>{
            var diff=parseFloat(h.amount)-parseFloat(h.expected_amount||h.amount);
            return <div key={h.id} className="card" style={{padding:"9px 12px",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
              <div>
                <p style={{fontWeight:700}}>{h.driver_name} {String.fromCharCode(0x2192)} {h.manager_name}</p>
                <p style={{fontSize:10,color:"#8a8078"}}>{new Date(h.created_at).toLocaleString("en-GB")} - {(h.order_ids||[]).length} orders</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontWeight:700,fontSize:14}}>{fmt(parseFloat(h.amount))}</p>
                {diff!==0&&<p style={{fontSize:10,color:diff>0?"#059669":"#dc2626",fontWeight:700}}>{diff>0?"Over by ":"Short by "}{fmt(Math.abs(diff))}</p>}
              </div>
            </div>;
          })}
        </div>}
      </div>;
    })()}

    {tab==="stations"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div><h3 style={{fontSize:16,marginBottom:2}}>Kitchen Stations & Printers</h3><p style={{fontSize:11,color:"#8a8078"}}>Configure each station's printer (browser, PrintNode, or none)</p></div>
        <button className="btn btn-r" onClick={()=>setEditStation({name:"",icon:"cook",color:"#bf4626",sortOrder:(stations||[]).length+1,active:true,printerMethod:"none",printerFormat:"thermal",printContent:"station_only",autoPrint:false,copies:1})} style={{padding:"7px 14px",fontSize:12}}>+ Add Station</button>
      </div>
      {(!stations||stations.length===0)?<div className="card" style={{textAlign:"center",padding:30}}>
        <p style={{fontSize:40,marginBottom:10}}>{EM.cook}</p>
        <p style={{fontSize:14,color:"#8a8078"}}>No stations yet. Click "+ Add Station" or run the migration SQL.</p>
      </div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:9}}>
        {stations.map(s=><div key={s.dbId} className="card" style={{padding:13,borderLeft:"5px solid "+s.color}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <p style={{fontWeight:700,fontSize:15}}>{s.name}</p>
            <span style={{padding:"2px 7px",background:s.active?"#d1fae5":"#f5f5f5",color:s.active?"#065f46":"#8a8078",borderRadius:4,fontSize:10,fontWeight:700}}>{s.active?"ACTIVE":"OFF"}</span>
          </div>
          <p style={{fontSize:11,color:"#8a8078",marginBottom:6}}>{menu.filter(m=>m.station===s.name).length} menu items</p>
          <div style={{padding:"7px 9px",background:"#f7f3ee",borderRadius:6,marginBottom:9,fontSize:11}}>
            <div style={{marginBottom:2}}><strong>Printer:</strong> {s.printerMethod==="none"?"None":s.printerMethod==="browser"?"Browser print":s.printerMethod==="printnode"?"PrintNode auto":(s.printerMethod||"none")}</div>
            {s.printerMethod&&s.printerMethod!=="none"&&<>
              <div style={{marginBottom:2}}><strong>Format:</strong> {s.printerFormat==="a4"?"A4":"Thermal 80mm"}</div>
              <div style={{marginBottom:2}}><strong>Content:</strong> {s.printContent==="full_order"?"Full order":s.printContent==="station_with_full_summary"?"Station + summary":"Station items only"}</div>
              <div><strong>Auto-print:</strong> {s.autoPrint?"Yes":"No"} - {s.copies||1} cop{(s.copies||1)>1?"ies":"y"}</div>
            </>}
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setEditStation(s)} style={{flex:2,padding:"7px",fontSize:11,fontWeight:700,background:"#1a1208",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>Edit Settings</button>
            <button onClick={()=>{
              var inUse=menu.filter(m=>m.station===s.name).length;
              if(inUse>0){if(!window.confirm("This station has "+inUse+" menu items. Delete anyway?"))return;}
              else{if(!window.confirm("Delete "+s.name+"?"))return;}
              setStations(ls=>ls.filter(x=>x.dbId!==s.dbId));
              dbDeleteStation(s.dbId).then(()=>push({title:"Deleted",body:s.name,color:"#dc2626"}));
            }} style={{padding:"7px 11px",fontSize:11,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>x</button>
          </div>
        </div>)}
      </div>}
      <div className="card" style={{padding:12,marginTop:12,background:"#fffbeb",borderLeft:"4px solid #d97706"}}>
        <p style={{fontSize:12,fontWeight:700,marginBottom:6,color:"#92400e"}}>{EM.star} PrintNode Setup (optional, for true auto-print)</p>
        <p style={{fontSize:11,color:"#92400e",marginBottom:7}}>If using PrintNode, install client at printnode.com and paste your API key below. It is stored only in this browser.</p>
        <input type="password" className="field" placeholder="PrintNode API key" defaultValue={(()=>{try{return localStorage.getItem("printnode_api_key")||"";}catch(e){return "";}})()} onChange={e=>{try{localStorage.setItem("printnode_api_key",e.target.value);}catch(err){}}} style={{fontSize:11}}/>
      </div>
    </div>}

    {tab==="delivery"&&(()=>{
      var ds=delivSettings[adminBranch]||{method:"radius",enabled:true,minOrder:15,freeOver:25,flatFee:2.50,maxRadius:3,zones:[],postcodes:[],codEnabled:true,codMinOrder:15,codMaxMiles:3};
      var update=(key,val)=>{setDelivSettings(s=>({...s,[adminBranch]:{...ds,[key]:val}}));};
      var save=()=>{
        dbSaveDelivery(adminBranch,ds).then(r=>{
          if(r.error)push({title:"Save failed",body:r.error.message,color:"#dc2626"});
          else push({title:"Delivery saved",body:(branches.find(b=>b.id===adminBranch)||{}).name,color:"#059669"});
        });
      };
      return <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div><h3 style={{fontSize:16,marginBottom:2}}>Delivery Settings</h3><p style={{fontSize:11,color:"#8a8078"}}>Configure delivery for each branch</p></div>
          <select value={adminBranch} onChange={e=>setAdminBranch(e.target.value)} style={{padding:"7px 10px",fontSize:12,border:"2px solid #ede8de",borderRadius:8,fontWeight:700,cursor:"pointer"}}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </div>
        <div className="card" style={{padding:16,marginBottom:10}}>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,cursor:"pointer"}}>
            <input type="checkbox" checked={ds.enabled!==false} onChange={e=>update("enabled",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <span style={{fontWeight:700}}>Delivery Enabled</span>
          </label>
          <p style={{fontSize:11,fontWeight:700,color:"#8a8078",letterSpacing:1,marginBottom:6}}>METHOD</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:12}}>
            {[["radius","Radius","Simple - X miles from here"],["postcode","Postcode","By UK postcode areas"],["zone","Zone","Tiered - multiple zones"]].map(([k,l,d])=><button key={k} onClick={()=>update("method",k)} style={{padding:"11px 6px",fontSize:12,fontWeight:700,background:ds.method===k?"#bf4626":"#fff",color:ds.method===k?"#fff":"#1a1208",border:"2px solid "+(ds.method===k?"#bf4626":"#ede8de"),borderRadius:8,cursor:"pointer",textAlign:"center"}}><div>{l}</div><div style={{fontSize:9,fontWeight:500,marginTop:2,opacity:.8}}>{d}</div></button>)}
          </div>
          <div className="g2" style={{marginBottom:12}}>
            <div><label className="lbl">Minimum order</label><input type="number" step="0.01" className="field" value={ds.minOrder||0} onChange={e=>update("minOrder",+e.target.value)}/></div>
            <div><label className="lbl">Free delivery over</label><input type="number" step="0.01" className="field" value={ds.freeOver||0} onChange={e=>update("freeOver",+e.target.value)} placeholder="0 = never free"/></div>
          </div>

          {ds.method==="radius"&&<div className="g2">
            <div><label className="lbl">Flat delivery fee</label><input type="number" step="0.01" className="field" value={ds.flatFee||0} onChange={e=>update("flatFee",+e.target.value)}/></div>
            <div><label className="lbl">Max radius (miles)</label><input type="number" className="field" value={ds.maxRadius||3} onChange={e=>update("maxRadius",+e.target.value)}/></div>
          </div>}

          {ds.method==="postcode"&&<div>
            <label className="lbl">Postcode areas and fees</label>
            {(ds.postcodes||[]).map((p,i)=><div key={i} style={{display:"flex",gap:5,marginBottom:5}}>
              <input className="field" value={p.prefix} onChange={e=>{var arr=[...ds.postcodes];arr[i]={...arr[i],prefix:e.target.value.toUpperCase()};update("postcodes",arr);}} placeholder="EC1" style={{flex:1}}/>
              <input type="number" step="0.01" className="field" value={p.fee} onChange={e=>{var arr=[...ds.postcodes];arr[i]={...arr[i],fee:+e.target.value};update("postcodes",arr);}} placeholder="Fee" style={{flex:1}}/>
              <button onClick={()=>{var arr=ds.postcodes.filter((_,x)=>x!==i);update("postcodes",arr);}} style={{padding:"0 12px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,fontWeight:700,cursor:"pointer"}}>x</button>
            </div>)}
            <button onClick={()=>update("postcodes",[...(ds.postcodes||[]),{prefix:"",fee:0}])} style={{padding:"8px 14px",fontSize:12,fontWeight:700,background:"#f7f3ee",border:"2px dashed #ede8de",borderRadius:7,cursor:"pointer",width:"100%"}}>+ Add Postcode</button>
          </div>}

          {ds.method==="zone"&&<div>
            <label className="lbl">Zones (tiered by distance)</label>
            {(ds.zones||[]).map((z,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 40px",gap:5,marginBottom:5}}>
              <input className="field" value={z.name||""} onChange={e=>{var arr=[...ds.zones];arr[i]={...arr[i],name:e.target.value};update("zones",arr);}} placeholder="Zone name"/>
              <input type="number" step="0.1" className="field" value={z.maxMiles||0} onChange={e=>{var arr=[...ds.zones];arr[i]={...arr[i],maxMiles:+e.target.value};update("zones",arr);}} placeholder="Max mi"/>
              <input type="number" step="0.01" className="field" value={z.fee||0} onChange={e=>{var arr=[...ds.zones];arr[i]={...arr[i],fee:+e.target.value};update("zones",arr);}} placeholder="Fee"/>
              <button onClick={()=>{var arr=ds.zones.filter((_,x)=>x!==i);update("zones",arr);}} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,fontWeight:700,cursor:"pointer"}}>x</button>
            </div>)}
            <button onClick={()=>update("zones",[...(ds.zones||[]),{name:"Zone "+((ds.zones||[]).length+1),maxMiles:3,fee:0}])} style={{padding:"8px 14px",fontSize:12,fontWeight:700,background:"#f7f3ee",border:"2px dashed #ede8de",borderRadius:7,cursor:"pointer",width:"100%"}}>+ Add Zone</button>
          </div>}
        </div>

        <div className="card" style={{padding:16,marginBottom:10}}>
          <p style={{fontSize:14,fontWeight:700,marginBottom:8}}>Cash on Delivery</p>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer"}}>
            <input type="checkbox" checked={ds.codEnabled!==false} onChange={e=>update("codEnabled",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <span style={{fontWeight:700}}>Accept Cash on Delivery</span>
          </label>
          {ds.codEnabled&&<div className="g2">
            <div><label className="lbl">Min order for COD</label><input type="number" step="0.01" className="field" value={ds.codMinOrder||15} onChange={e=>update("codMinOrder",+e.target.value)}/></div>
            <div><label className="lbl">Max miles for COD</label><input type="number" className="field" value={ds.codMaxMiles||3} onChange={e=>update("codMaxMiles",+e.target.value)}/></div>
          </div>}
        </div>

        <div className="card" style={{padding:16,marginBottom:10}}>
          <p style={{fontSize:14,fontWeight:700,marginBottom:4}}>Service Charge (Dine-in)</p>
          <p style={{fontSize:11,color:"#8a8078",marginBottom:9}}>Optional gratuity added to dine-in bills. Not applied to delivery or collection.</p>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer"}}>
            <input type="checkbox" checked={ds.serviceChargeEnabled||false} onChange={e=>update("serviceChargeEnabled",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <span style={{fontWeight:700}}>Add service charge to dine-in bills</span>
          </label>
          {ds.serviceChargeEnabled&&<>
            <div className="g2" style={{marginBottom:9}}>
              <div><label className="lbl">Percentage %</label><input type="number" step="0.5" className="field" value={ds.serviceChargePercent||12.5} onChange={e=>update("serviceChargePercent",+e.target.value)}/></div>
              <div><label className="lbl">Auto-apply for groups of</label><input type="number" className="field" value={ds.serviceChargeGroupSize||6} onChange={e=>update("serviceChargeGroupSize",+e.target.value)}/></div>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input type="checkbox" checked={ds.serviceChargeMandatory||false} onChange={e=>update("serviceChargeMandatory",e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
              <span style={{fontSize:13}}>Mandatory (customer cannot remove)</span>
            </label>
          </>}
        </div>

        <button className="btn btn-r" onClick={save} style={{width:"100%",padding:"13px",fontSize:14}}>Save Delivery Settings</button>
      </div>;
    })()}

    {tab==="codes"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div><h3 style={{fontSize:16,marginBottom:2}}>Promo Codes</h3><p style={{fontSize:11,color:"#8a8078"}}>Customer-entered discount codes</p></div>
        <button className="btn btn-r" onClick={()=>setEditCode({type:"percent",value:10,minOrder:0,maxUses:100,active:true})} style={{padding:"7px 14px",fontSize:12}}>+ Create Code</button>
      </div>
      {promoCodes.length===0?<div className="card" style={{textAlign:"center",padding:30}}>
        <p style={{fontSize:40,marginBottom:10}}>{EM.star}</p>
        <p style={{fontSize:14,color:"#8a8078"}}>No promo codes yet</p>
      </div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:8}}>
        {promoCodes.map(c=><div key={c.dbId} className="card" style={{padding:12,borderLeft:"4px solid "+(c.active?"#059669":"#8a8078")}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <p style={{fontWeight:700,fontSize:16,letterSpacing:1,color:"#bf4626"}}>{c.code}</p>
            <span style={{padding:"2px 7px",background:c.active?"#d1fae5":"#f5f5f5",color:c.active?"#065f46":"#8a8078",borderRadius:4,fontSize:10,fontWeight:700}}>{c.active?"ACTIVE":"INACTIVE"}</span>
          </div>
          <p style={{fontSize:13,fontWeight:700,marginBottom:3}}>{c.type==="percent"?c.value+"% off":c.type==="fixed"?fmt(c.value)+" off":"Free delivery"}</p>
          {c.description&&<p style={{fontSize:11,color:"#8a8078",marginBottom:6}}>{c.description}</p>}
          <div style={{fontSize:11,color:"#8a8078",marginBottom:8}}>
            <div>Min order: {fmt(c.minOrder)}</div>
            <div>Used: {c.uses}/{c.maxUses}</div>
            {c.firstOrderOnly&&<div style={{color:"#d4952a",fontWeight:700}}>First order only</div>}
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setEditCode(c)} style={{flex:1,padding:"6px",fontSize:11,fontWeight:700,background:"#f7f3ee",border:"none",borderRadius:6,cursor:"pointer"}}>Edit</button>
            <button onClick={()=>{if(!window.confirm("Delete code "+c.code+"?"))return;setPromoCodes(cs=>cs.filter(x=>x.dbId!==c.dbId));dbDeleteCode(c.dbId).then(r=>{if(r.error)push({title:"Delete failed",body:r.error.message,color:"#dc2626"});else push({title:"Code deleted",body:c.code,color:"#dc2626"});});}} style={{padding:"6px 12px",fontSize:11,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>x</button>
          </div>
        </div>)}
      </div>}
    </div>}

    {tab==="autodisc"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div><h3 style={{fontSize:16,marginBottom:2}}>Auto Discounts</h3><p style={{fontSize:11,color:"#8a8078"}}>Offers that apply automatically without a code</p></div>
        <button className="btn btn-r" onClick={()=>setEditAuto({name:"",ruleType:"min_order",minOrder:30,discountType:"percent",discountValue:10,active:true})} style={{padding:"7px 14px",fontSize:12}}>+ Create Offer</button>
      </div>
      {autoDiscs.length===0?<div className="card" style={{textAlign:"center",padding:30}}>
        <p style={{fontSize:40,marginBottom:10}}>{EM.party}</p>
        <p style={{fontSize:14,color:"#8a8078"}}>No auto offers yet</p>
      </div>:<div style={{display:"grid",gap:8}}>
        {autoDiscs.map(a=><div key={a.dbId} className="card" style={{padding:12,borderLeft:"4px solid "+(a.active?"#7c3aed":"#8a8078")}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,gap:8}}>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:15,marginBottom:3}}>{a.name}</p>
              <p style={{fontSize:12,color:"#8a8078"}}>{a.description}</p>
              <p style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginTop:4}}>{a.discountType==="percent"?a.discountValue+"%":a.discountType==="fixed"?fmt(a.discountValue):"Free delivery"} on orders over {fmt(a.minOrder)}</p>
            </div>
            <span style={{padding:"2px 7px",background:a.active?"#d1fae5":"#f5f5f5",color:a.active?"#065f46":"#8a8078",borderRadius:4,fontSize:10,fontWeight:700}}>{a.active?"ON":"OFF"}</span>
          </div>
          <div style={{display:"flex",gap:5,marginTop:6}}>
            <button onClick={()=>setEditAuto(a)} style={{flex:1,padding:"6px",fontSize:11,fontWeight:700,background:"#f7f3ee",border:"none",borderRadius:6,cursor:"pointer"}}>Edit</button>
            <button onClick={()=>{if(!window.confirm("Delete offer "+a.name+"?"))return;setAutoDiscs(ls=>ls.filter(x=>x.dbId!==a.dbId));dbDeleteAutoDiscount(a.dbId).then(()=>push({title:"Offer deleted",body:a.name,color:"#dc2626"}));}} style={{padding:"6px 12px",fontSize:11,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>x</button>
          </div>
        </div>)}
      </div>}
    </div>}

    {tab==="stock"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:9}}>{menu.slice().sort((a,b)=>a.stock-b.stock).map(item=>{var cl=item.stock===0?"#dc2626":item.stock<=5?"#d97706":"#059669";return <div key={item.id} className="card" style={{padding:"11px 12px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}><p style={{fontWeight:700,fontSize:12}}>{item.name}</p><span style={{fontWeight:700,fontSize:14,color:cl}}>{item.stock}</span></div><div style={{height:4,background:"#f7f3ee",borderRadius:2,overflow:"hidden",marginBottom:7}}><div style={{height:"100%",background:cl,width:Math.min(100,Math.round((item.stock/40)*100))+"%",borderRadius:2}}/></div><div style={{display:"flex",gap:4}}><button onClick={()=>setMenu(ms=>ms.map(m=>m.id===item.id?{...m,stock:Math.max(0,m.stock-1)}:m))} style={{width:24,height:24,borderRadius:5,background:"#f7f3ee",fontWeight:700,fontSize:14,color:"#bf4626",border:"none",cursor:"pointer"}}>-</button><input type="number" value={item.stock} onChange={e=>setMenu(ms=>ms.map(m=>m.id===item.id?{...m,stock:Math.max(0,+e.target.value)}:m))} style={{flex:1,padding:"3px 5px",border:"2px solid #ede8de",borderRadius:5,fontSize:12,textAlign:"center"}}/><button onClick={()=>setMenu(ms=>ms.map(m=>m.id===item.id?{...m,stock:m.stock+1}:m))} style={{width:24,height:24,borderRadius:5,background:"#f7f3ee",fontWeight:700,fontSize:14,color:"#059669",border:"none",cursor:"pointer"}}>+</button><button onClick={()=>setMenu(ms=>ms.map(m=>m.id===item.id?{...m,stock:40}:m))} style={{padding:"3px 6px",borderRadius:5,fontSize:10,fontWeight:700,background:"#1a1208",color:"#fff",border:"none",cursor:"pointer"}}>Restock</button></div></div>;})}</div>}
    {tab==="discounts"&&<div><div className="card" style={{marginBottom:12}}><h3 style={{fontSize:14,marginBottom:9}}>Create Code</h3><div className="g2" style={{marginBottom:8}}><div><label className="lbl">Code</label><input className="field" value={nc.code} onChange={e=>setNC(n=>({...n,code:e.target.value.toUpperCase()}))} placeholder="SUMMER20"/></div><div><label className="lbl">Type</label><select className="field" value={nc.type} onChange={e=>setNC(n=>({...n,type:e.target.value}))}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></div><div><label className="lbl">Value</label><input type="number" className="field" value={nc.value} onChange={e=>setNC(n=>({...n,value:e.target.value}))} placeholder="10"/></div><div><label className="lbl">Desc</label><input className="field" value={nc.desc} onChange={e=>setNC(n=>({...n,desc:e.target.value}))} placeholder="Summer deal"/></div></div><button className="btn btn-r" onClick={addCode} style={{padding:"8px 18px"}}>Create</button></div>{discounts.map((d,i)=><div key={i} className="card" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:7}}><div><span style={{fontWeight:700,fontSize:13,fontFamily:"monospace",background:"#f7f3ee",padding:"2px 8px",borderRadius:5}}>{d.code}</span><span className="bdg" style={{background:d.active?"#d1fae5":"#fee2e2",color:d.active?"#065f46":"#dc2626",marginLeft:7}}>{d.active?"Active":"Off"}</span><p style={{color:"#8a8078",fontSize:11,marginTop:2}}>{d.type==="percent"?d.value+"%":fmt(d.value)} off</p></div><button onClick={()=>setDiscounts(ds=>ds.map((x,j)=>j===i?{...x,active:!x.active}:x))} style={{padding:"4px 11px",borderRadius:7,fontWeight:600,fontSize:11,border:"2px solid #ede8de",background:"#fff",cursor:"pointer"}}>{d.active?"Deactivate":"Activate"}</button></div>)}</div>}
    {tab==="hours"&&<div>
      {hoursLoading&&<div className="card" style={{padding:30,textAlign:"center",color:"#8a8078"}}>Loading hours...</div>}
      {!hoursLoading&&branches.map(b=>{
        var todayDay=DAYS[new Date().getDay()];
        var bHours=advHours[b.id]||{};
        var bHolidays=holidays[b.id]||[];
        var cfg=hoursConfig[b.id]||{};
        var isExpanded=editingBranch===b.id;
        var DAY_NAMES=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        return <div key={b.id} className="card" style={{marginBottom:14,padding:0,overflow:"hidden"}}>
          {/* Branch header */}
          <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:2}}>{b.name}</h3>
              <p style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>{b.addr}</p>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span className="bdg" style={{background:isOpenNow(b.id)?"#d1fae5":"#fee2e2",color:isOpenNow(b.id)?"#059669":"#dc2626",fontWeight:700}}>{isOpenNow(b.id)?"Open Now":"Closed"}</span>
              <button onClick={()=>setEditingBranch(isExpanded?null:b.id)} style={{padding:"6px 13px",background:isExpanded?"#bf4626":"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>{isExpanded?"Collapse":"Edit Hours"}</button>
            </div>
          </div>

          {/* Compact summary view (when collapsed) */}
          {!isExpanded&&<div style={{padding:12}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:6}}>
              {DAY_NAMES.map(day=>{
                var dh=bHours[day]||{};
                var primary=dh.all_1||dh["dine-in_1"]||{};
                var isToday=day===todayDay;
                return <div key={day} style={{background:isToday?"#fff5f3":"#f7f3ee",borderRadius:7,padding:"7px 9px",border:isToday?"2px solid #bf4626":"1px solid #ede8de"}}>
                  <p style={{fontWeight:700,fontSize:11,color:isToday?"#bf4626":"#8a8078",marginBottom:2}}>{day}{isToday?" (Today)":""}</p>
                  {primary.is_closed?<p style={{fontSize:11,color:"#dc2626",fontWeight:700}}>CLOSED</p>:
                    primary.open_time?<>
                      <p style={{fontWeight:600,fontSize:12}}>{primary.open_time} - {primary.close_time}</p>
                      {primary.last_order_time&&<p style={{fontSize:10,color:"#8a8078"}}>Last: {primary.last_order_time}</p>}
                    </>:<p style={{fontSize:11,color:"#8a8078"}}>Not set</p>}
                </div>;
              })}
            </div>
            {bHolidays.length>0&&<div style={{marginTop:10,padding:"7px 11px",background:"#fef3c7",borderRadius:6,fontSize:11,color:"#92400e"}}>
              <strong>{bHolidays.length} holiday{bHolidays.length>1?"s":""} configured</strong>
            </div>}
          </div>}

          {/* Expanded edit view */}
          {isExpanded&&<div style={{padding:14}}>
            {/* Config toggles */}
            <div style={{padding:11,background:"#fafaf5",borderRadius:8,marginBottom:14,border:"1px solid #ede8de"}}>
              <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:7}}>BEHAVIOR SETTINGS</p>
              <label style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,cursor:"pointer"}}>
                <input type="checkbox" checked={cfg.block_orders_when_closed!==false} onChange={e=>saveConfig(b.id,{block_orders_when_closed:e.target.checked})} style={{width:16,height:16}}/>
                <span style={{fontSize:12}}>Block customer orders when closed</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,cursor:"pointer"}}>
                <input type="checkbox" checked={cfg.block_orders_after_last_order!==false} onChange={e=>saveConfig(b.id,{block_orders_after_last_order:e.target.checked})} style={{width:16,height:16}}/>
                <span style={{fontSize:12}}>Block customer orders after last order time</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,cursor:"pointer"}}>
                <input type="checkbox" checked={cfg.show_last_order_warning!==false} onChange={e=>saveConfig(b.id,{show_last_order_warning:e.target.checked})} style={{width:16,height:16}}/>
                <span style={{fontSize:12}}>Show "last orders" warning to customers ({cfg.warning_threshold_minutes||30} min before)</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <input type="checkbox" checked={cfg.allow_staff_override!==false} onChange={e=>saveConfig(b.id,{allow_staff_override:e.target.checked})} style={{width:16,height:16}}/>
                <span style={{fontSize:12}}>Allow staff to override and accept late orders</span>
              </label>
            </div>

            {/* Per-day editor */}
            <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:7}}>OPENING HOURS BY DAY</p>
            {DAY_NAMES.map(day=>{
              var dh=bHours[day]||{};
              var primary=dh.all_1||{};
              var isToday=day===todayDay;
              return <div key={day} style={{padding:11,background:isToday?"#fff5f3":"#fff",borderRadius:8,marginBottom:7,border:isToday?"2px solid #bf4626":"1px solid #ede8de"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{minWidth:60,fontWeight:700,fontSize:13,color:isToday?"#bf4626":"#1a1208"}}>{day}{isToday?" (Today)":""}</div>
                  <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                    <input type="checkbox" checked={primary.is_closed||false} onChange={e=>saveDayHours(b.id,day,"all",1,{...primary,is_closed:e.target.checked})} style={{width:16,height:16}}/>
                    <span style={{fontSize:11,fontWeight:700,color:"#dc2626"}}>Closed all day</span>
                  </label>
                  {!primary.is_closed&&<>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>OPEN</label>
                      <input type="time" value={primary.open_time||""} onChange={e=>saveDayHours(b.id,day,"all",1,{...primary,open_time:e.target.value})} style={{padding:"5px 7px",border:"1px solid #ede8de",borderRadius:5,fontSize:12,width:90}}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>CLOSE</label>
                      <input type="time" value={primary.close_time||""} onChange={e=>saveDayHours(b.id,day,"all",1,{...primary,close_time:e.target.value})} style={{padding:"5px 7px",border:"1px solid #ede8de",borderRadius:5,fontSize:12,width:90}}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>LAST ORDER</label>
                      <input type="time" value={primary.last_order_time||""} onChange={e=>saveDayHours(b.id,day,"all",1,{...primary,last_order_time:e.target.value})} style={{padding:"5px 7px",border:"1px solid #ede8de",borderRadius:5,fontSize:12,width:90,background:"#fef3c7"}}/>
                    </div>
                  </>}
                </div>
              </div>;
            })}

            {/* Holidays section */}
            <div style={{marginTop:14,padding:12,background:"#fafaf5",borderRadius:8,border:"1px solid #ede8de"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <p style={{fontSize:13,fontWeight:700}}>{EM.cal} Holidays & Special Dates</p>
                <button onClick={()=>{setEditHoliday({branch_id:b.id,holiday_date:"",holiday_name:"",is_closed:true,open_time:"",close_time:"",last_order_time:"",notes:""});setShowHolidayModal(true);}} style={{padding:"6px 12px",background:"#bf4626",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Add Holiday</button>
              </div>
              {bHolidays.length===0?<p style={{fontSize:11,color:"#8a8078",fontStyle:"italic"}}>No holidays configured. Add Christmas, Easter, etc.</p>:bHolidays.map(h=><div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 9px",background:"#fff",borderRadius:6,marginBottom:4,border:"1px solid #ede8de"}}>
                <div>
                  <p style={{fontSize:12,fontWeight:700}}>{h.holiday_name} - {new Date(h.holiday_date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p>
                  <p style={{fontSize:11,color:h.is_closed?"#dc2626":"#059669",fontWeight:700}}>{h.is_closed?"CLOSED":"Open "+h.open_time+" - "+h.close_time+(h.last_order_time?" (last order "+h.last_order_time+")":"")}</p>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>{setEditHoliday(h);setShowHolidayModal(true);}} style={{padding:"4px 9px",background:"#f7f3ee",border:"1px solid #ede8de",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>Edit</button>
                  <button onClick={()=>deleteHoliday(b.id,h.id)} style={{padding:"4px 9px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>Delete</button>
                </div>
              </div>)}
            </div>
          </div>}
        </div>;
      })}

      {/* Holiday modal */}
      {showHolidayModal&&editHoliday&&<div onClick={()=>setShowHolidayModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:18,maxWidth:480,width:"100%"}}>
          <h3 style={{fontSize:17,fontWeight:700,marginBottom:11}}>{editHoliday.id?"Edit":"Add"} Holiday</h3>
          <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3,display:"block"}}>HOLIDAY NAME</label>
          <input value={editHoliday.holiday_name} onChange={e=>setEditHoliday({...editHoliday,holiday_name:e.target.value})} placeholder="Christmas Day" className="field" style={{marginBottom:9}}/>
          <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3,display:"block"}}>DATE</label>
          <input type="date" value={editHoliday.holiday_date} onChange={e=>setEditHoliday({...editHoliday,holiday_date:e.target.value})} className="field" style={{marginBottom:9}}/>
          <label style={{display:"flex",alignItems:"center",gap:6,marginBottom:9,cursor:"pointer"}}>
            <input type="checkbox" checked={editHoliday.is_closed} onChange={e=>setEditHoliday({...editHoliday,is_closed:e.target.checked})} style={{width:16,height:16}}/>
            <span style={{fontSize:13,fontWeight:700}}>Closed all day</span>
          </label>
          {!editHoliday.is_closed&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:9}}>
            <div><label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>OPEN</label><input type="time" value={editHoliday.open_time||""} onChange={e=>setEditHoliday({...editHoliday,open_time:e.target.value})} className="field" style={{fontSize:12,padding:"6px 8px"}}/></div>
            <div><label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>CLOSE</label><input type="time" value={editHoliday.close_time||""} onChange={e=>setEditHoliday({...editHoliday,close_time:e.target.value})} className="field" style={{fontSize:12,padding:"6px 8px"}}/></div>
            <div><label style={{fontSize:10,color:"#8a8078",fontWeight:700}}>LAST ORDER</label><input type="time" value={editHoliday.last_order_time||""} onChange={e=>setEditHoliday({...editHoliday,last_order_time:e.target.value})} className="field" style={{fontSize:12,padding:"6px 8px"}}/></div>
          </div>}
          <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:3,display:"block"}}>NOTES (OPTIONAL)</label>
          <input value={editHoliday.notes||""} onChange={e=>setEditHoliday({...editHoliday,notes:e.target.value})} placeholder="e.g., Boxing Day - shorter hours" className="field" style={{marginBottom:11}}/>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setShowHolidayModal(false)} style={{flex:1,padding:"10px",background:"#f7f3ee",border:"1px solid #ede8de",borderRadius:7,fontWeight:700,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={()=>{
              if(!editHoliday.holiday_name||!editHoliday.holiday_date){alert("Name and date required");return;}
              saveHoliday(editHoliday.branch_id,editHoliday);
              setShowHolidayModal(false);
              push({title:"Holiday saved",body:editHoliday.holiday_name,color:"#059669"});
            }} style={{flex:2,padding:"10px",background:"#059669",color:"#fff",border:"none",borderRadius:7,fontWeight:700,cursor:"pointer",fontSize:13}}>Save Holiday</button>
          </div>
        </div>
      </div>}
    </div>}

    {tab==="settings"&&<div>
      <div className="card" style={{padding:16,marginBottom:12}}>
        <p style={{fontSize:15,fontWeight:700,marginBottom:6}}>POS User Interface</p>
        <p style={{fontSize:11,color:"#8a8078",marginBottom:12}}>Choose how the POS screen looks for staff. Each style is optimized for different needs.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8}}>
          {[
            {id:"modern",name:"Modern",desc:"Clean, mobile-friendly, beautiful design",icon:EM.star,color:"#bf4626"},
            {id:"classic",name:"Classic",desc:"Traditional POSCUBE-style with category buttons",icon:EM.cook,color:"#d4952a"},
            {id:"compact",name:"Compact",desc:"Small screens & tablets, condensed layout",icon:EM.phone,color:"#7c3aed"},
          ].map(opt=><button key={opt.id} onClick={()=>{setPosUiStyle(opt.id);try{localStorage.setItem("pos_ui_style",opt.id);}catch(e){}push({title:"UI updated",body:opt.name+" UI now active",color:opt.color});}} style={{padding:"14px 13px",background:posUiStyle===opt.id?opt.color:"#fff",color:posUiStyle===opt.id?"#fff":"#1a1208",border:"3px solid "+opt.color,borderRadius:12,cursor:"pointer",textAlign:"left",fontWeight:700,transition:"all .15s"}}>
            <div style={{fontSize:24,marginBottom:5}}>{opt.icon}</div>
            <p style={{fontSize:14,fontWeight:700,marginBottom:3}}>{opt.name}{posUiStyle===opt.id?" - Active":""}</p>
            <p style={{fontSize:10,opacity:.85,fontWeight:400,lineHeight:1.4}}>{opt.desc}</p>
          </button>)}
        </div>
      </div>

      <div className="card" style={{padding:16,marginBottom:12}}>
        <p style={{fontSize:15,fontWeight:700,marginBottom:6}}>On-Screen Keyboard Size</p>
        <p style={{fontSize:11,color:"#8a8078",marginBottom:12}}>Pick keyboard button size for staff. Larger sizes are easier to tap on touchscreens.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[
            {id:"small",name:"Small",desc:"Compact - fits more on screen",h:46,fs:16},
            {id:"medium",name:"Medium",desc:"Balanced - good for most users",h:58,fs:20},
            {id:"large",name:"Large",desc:"Big buttons - best for touchscreens",h:72,fs:24},
          ].map(opt=><button key={opt.id} onClick={()=>{setKbSize(opt.id);try{localStorage.setItem("kb_size",opt.id);}catch(e){}push({title:"Keyboard size "+opt.name,body:"Will apply to next phone order",color:"#bf4626"});}} style={{padding:"14px 11px",background:kbSize===opt.id?"#bf4626":"#fff",color:kbSize===opt.id?"#fff":"#1a1208",border:"3px solid #bf4626",borderRadius:11,cursor:"pointer",textAlign:"left",fontWeight:700}}>
            <div style={{height:opt.h/3,background:kbSize===opt.id?"rgba(255,255,255,.2)":"#f7f3ee",borderRadius:5,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:opt.fs/2,fontWeight:700}}>A B C</div>
            <p style={{fontSize:13,marginBottom:2}}>{opt.name}{kbSize===opt.id?" - Active":""}</p>
            <p style={{fontSize:9,opacity:.85,fontWeight:400,lineHeight:1.3}}>{opt.desc}</p>
          </button>)}
        </div>
      </div>

      <div className="card" style={{padding:16,marginBottom:12}}>
        <p style={{fontSize:15,fontWeight:700,marginBottom:6}}>POS Dashboard Home Screen</p>
        <p style={{fontSize:11,color:"#8a8078",marginBottom:12}}>Show a dashboard with quick-access tiles when staff opens POS. Like POSCUBE-style restaurants.</p>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={showDashboard} onChange={e=>{setShowDashboard(e.target.checked);try{localStorage.setItem("show_pos_dashboard",e.target.checked?"1":"0");}catch(err){}push({title:"Dashboard "+(e.target.checked?"enabled":"disabled"),body:"Refresh POS to see change",color:"#2563eb"});}} style={{width:18,height:18,cursor:"pointer"}}/>
          <span style={{fontWeight:700,fontSize:13}}>Show dashboard home screen on POS</span>
        </label>
        <p style={{fontSize:10,color:"#8a8078",marginTop:8}}>Note: Dashboard feature is being built. Toggle on to be ready when it launches.</p>
      </div>

      <div className="card" style={{padding:16,background:"#fffbeb",borderLeft:"4px solid #f59e0b"}}>
        <p style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:5}}>Coming Soon</p>
        <p style={{fontSize:11,color:"#92400e",marginBottom:6}}>The Classic and Compact UI styles are currently placeholder screens.</p>
        <p style={{fontSize:11,color:"#92400e"}}>For full feature access, keep "Modern" UI selected. We will build out Classic and Compact in upcoming updates.</p>
      </div>
    </div>}
  </div>;
}

function ReportV({orders}){
  var data=Array.from({length:56}).map((_,i)=>{var d=new Date();d.setDate(d.getDate()-i);var we=d.getDay()===0||d.getDay()===6;return{day:d.toLocaleDateString("en-GB",{month:"short",day:"numeric"}),rev:Math.round((we?420:280)+Math.random()*180)};}).reverse();
  var last7=data.slice(-7),last30=data.slice(-30),tr=last30.reduce((s,d)=>s+d.rev,0),mx=Math.max(...last7.map(d=>d.rev),1);
  return <div className="page">
    <h2 style={{fontSize:24,marginBottom:4}}>Sales Reports</h2>
    <p style={{color:"#8a8078",fontSize:13,marginBottom:18}}>Last 30 days overview</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:9,marginBottom:18}}>{[["30-Day Revenue",fmt(tr),"#bf4626"],["30-Day Orders",last30.length,"#2563eb"],["Avg Order",fmt(tr/Math.max(last30.length,1)),"#4a7155"]].map(([l,v,c])=><div key={l} className="card"><div style={{fontSize:20,fontWeight:700,color:c,marginBottom:2}}>{v}</div><div style={{fontSize:11,color:"#8a8078",fontWeight:600}}>{l}</div></div>)}</div>
    <div className="card" style={{marginBottom:14}}>
      <h3 style={{fontSize:16,marginBottom:12}}>Revenue - Last 7 Days</h3>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:72}}>{last7.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{width:"100%",background:"#bf4626",borderRadius:"3px 3px 0 0",height:Math.round((d.rev/mx)*64)+"px",opacity:.7+.3*(d.rev/mx),minHeight:4}}/><span style={{fontSize:9,color:"#8a8078",textAlign:"center"}}>{d.day}</span></div>)}</div>
    </div>
  </div>;
}

// -- TABLES / FLOOR PLAN ---------------------------------------------------
// eslint-disable-next-line no-unused-vars
var TABLES0=[
  {id:1,seats:2,x:10,y:10,status:"free"},
  {id:2,seats:2,x:10,y:30,status:"occupied",since:"12:15",guests:2,orderId:"ORD-1001"},
  {id:3,seats:4,x:10,y:50,status:"free"},
  {id:4,seats:4,x:35,y:10,status:"reserved",resTime:"19:00",resName:"Johnson"},
  {id:5,seats:4,x:35,y:30,status:"occupied",since:"12:30",guests:3},
  {id:6,seats:6,x:35,y:50,status:"free"},
  {id:7,seats:2,x:60,y:10,status:"free"},
  {id:8,seats:4,x:60,y:30,status:"occupied",since:"12:45",guests:4,orderId:"ORD-1002"},
  {id:9,seats:6,x:60,y:50,status:"free"},
  {id:10,seats:8,x:85,y:30,status:"reserved",resTime:"20:00",resName:"Smith party"},
];

function TablesV({tables,setTables,push,branch,orders,setOrders,onGoToPos}){
  var [tablesDeliv,setTablesDeliv]=useState(null);
  useEffect(()=>{
    if(!branch)return;
    dbFetchAllDelivery().then(list=>{
      var s=(list||[]).find(x=>x.branch_id===branch.id);
      if(s){
        setTablesDeliv({
          serviceChargeEnabled:s.service_charge_enabled||false,
          serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
          serviceChargeMandatory:s.service_charge_mandatory||false,
        });
      }
    });
  },[branch]);
  var [selected,setSelected]=useState(null);
  var [guestCount,setGuestCount]=useState(2);
  var [paymentStep,setPaymentStep]=useState(null);
  var [splitMode,setSplitMode]=useState("amount");
  var [splitN,setSplitN]=useState(2);
  var [paidSplits,setPaidSplits]=useState([]);
  var [itemSplit,setItemSplit]=useState({});
  var [customAmount,setCustomAmount]=useState("");
  // Filter tables by current branch
  var branchTables=branch?tables.filter(t=>!t.branchId||t.branchId===branch.id):tables;
  var t=branchTables.find(t=>t.id===selected);

  // Get all unpaid orders for selected table - MUST match branch + table number
  var tableOrders=t&&orders?orders.filter(o=>{
    // Must match this branch
    if(branch&&o.branchId&&o.branchId!==branch.id)return false;
    // Must match this table number (strict match - both as numbers)
    var orderTableNum=parseInt(o.tableId);
    var thisTableNum=parseInt(t.id);
    if(isNaN(orderTableNum)||isNaN(thisTableNum))return false;
    if(orderTableNum!==thisTableNum)return false;
    // Must be unpaid + not cancelled
    if(o.paid)return false;
    if(o.status==="cancelled")return false;
    return true;
  }):[];
  // Aggregate items across all orders for this table (for display)
  var allItems=[];
  tableOrders.forEach(o=>{(o.items||[]).forEach(it=>{
    var ex=allItems.find(x=>x.name===it.name&&x.price===it.price);
    if(ex)ex.qty+=it.qty;
    else allItems.push({...it,orderId:o.id});
  });});
  // CRITICAL: Use saved order totals (already include discount + service charge)
  // not re-calculated from items - that would lose the customer's promo discount
  var subtotal=tableOrders.reduce((s,o)=>s+parseFloat(o.subtotal||o.items?.reduce((x,i)=>x+(+i.price||0)*i.qty,0)||0),0);
  var totalDiscount=tableOrders.reduce((s,o)=>s+parseFloat(o.discount||0),0);
  var totalServiceCharge=tableOrders.reduce((s,o)=>s+parseFloat(o.serviceCharge||0),0);
  // If service charge wasn't on order, calculate it now (for staff-taken orders that didn't have it)
  if(totalServiceCharge===0&&tablesDeliv&&tablesDeliv.serviceChargeEnabled){
    totalServiceCharge=Math.max(0,subtotal-totalDiscount)*((tablesDeliv.serviceChargePercent||0)/100);
  }
  var serviceChargeT=totalServiceCharge;
  var vat=subtotal-subtotal/1.2;
  // Total is sum of saved order totals (already correct)
  var total=tableOrders.reduce((s,o)=>{
    var t=parseFloat(o.total||0);
    if(t>0)return s+t;
    // Fallback if total wasn't saved
    return s+(parseFloat(o.subtotal||0)-parseFloat(o.discount||0)+parseFloat(o.serviceCharge||0));
  },0);
  // If no orders had totals saved, fall back to calculated
  if(total===0)total=subtotal-totalDiscount+serviceChargeT;

  var updateTable=(id,updates)=>{
    // Match by BOTH branch_id AND table_number to avoid updating same-numbered tables in other branches
    var currentBranchId=branch?.id;
    setTables(ts=>ts.map(x=>{
      var matches=x.id===id&&(!currentBranchId||!x.branchId||x.branchId===currentBranchId);
      return matches?{...x,...updates}:x;
    }));
    // Find the correct table (this branch only) and save to DB
    var tbl=tables.find(x=>x.id===id&&(!currentBranchId||!x.branchId||x.branchId===currentBranchId));
    if(tbl?.dbId){
      dbUpdateTableStatus(tbl.dbId,updates.status||tbl.status,{}).catch(e=>console.log("Table status save failed:",e));
    }
  };

  var seat=(guests)=>{
    updateTable(selected,{status:"occupied",since:nowT(),guests:guests,orderId:null,resTime:null,resName:null});
    push({title:"Table "+selected+" seated",body:guests+" guests",color:"#2563eb"});
    setSelected(null);
  };
  var clearT=()=>{
    if(tableOrders.length>0){
      if(!window.confirm("Table has "+tableOrders.length+" unpaid order(s) totaling "+fmt(total)+". Clear without payment?"))return;
    }
    updateTable(selected,{status:"free",since:null,guests:null,orderId:null,resTime:null,resName:null});
    push({title:"Table "+selected+" cleared",body:"Ready for next guests",color:"#059669"});
    setSelected(null);
    setPaymentStep(null);
  };
  var reserve=()=>{
    var nm=prompt("Reservation name:");if(!nm)return;
    var tm=prompt("Time (HH:MM):","19:00");if(!tm)return;
    updateTable(selected,{status:"reserved",resName:nm,resTime:tm,guests:null,since:null,orderId:null});
    setSelected(null);
  };
  // Mark all table orders as paid and free the table
  var payAll=(method)=>{
    tableOrders.forEach(o=>{
      setOrders(os=>os.map(x=>x.id===o.id?{...x,paid:true,payMethod:method}:x));
      // Save to DB
      dbUpdateOrderPayment(o.id,true,method).catch(e=>console.log("Payment save failed:",e));
    });
    updateTable(selected,{status:"free",since:null,guests:null,orderId:null});
    push({title:"Payment received",body:fmt(total)+" by "+method+" - Table "+selected+" cleared",color:"#059669"});
    setSelected(null);
    setPaymentStep(null);
    setPaidSplits([]);
    setSplitN(2);
    setItemSplit({});
  };
  // Handle partial split payment
  var paySplitPortion=(amount,method)=>{
    setPaidSplits(ps=>[...ps,{amount,method,at:nowT()}]);
    var totalPaid=paidSplits.reduce((s,p)=>s+p.amount,0)+amount;
    if(totalPaid>=total-0.01){
      // All paid, close out
      tableOrders.forEach(o=>{
        setOrders(os=>os.map(x=>x.id===o.id?{...x,paid:true,payMethod:"split"}:x));
        // Save to DB
        dbUpdateOrderPayment(o.id,true,"split").catch(e=>console.log("Payment save failed:",e));
      });
      updateTable(selected,{status:"free",since:null,guests:null,orderId:null});
      push({title:"Bill fully paid",body:"Table "+selected+" cleared",color:"#059669"});
      setSelected(null);
      setPaymentStep(null);
      setPaidSplits([]);
      setSplitN(2);
      setItemSplit({});
    }else{
      push({title:"Split payment",body:fmt(amount)+" by "+method+" received",color:"#2563eb"});
    }
  };

  var stats={
    free:branchTables.filter(t=>t.status==="free").length,
    occupied:branchTables.filter(t=>t.status==="occupied").length,
    reserved:branchTables.filter(t=>t.status==="reserved").length,
    total:branchTables.length,
    guests:branchTables.filter(t=>t.status==="occupied").reduce((s,t)=>s+(t.guests||0),0),
    capacity:branchTables.reduce((s,t)=>s+t.seats,0),
  };
  var utilization=stats.capacity>0?Math.round((stats.guests/stats.capacity)*100):0;
  var colors={free:"#10b981",occupied:"#dc2626",reserved:"#d4952a"};
  var bgs={free:"#d1fae5",occupied:"#fee2e2",reserved:"#fef3c7"};

  return <div className="page">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:22,marginBottom:2}}>Floor Plan</h2><p style={{color:"#8a8078",fontSize:12}}>Tap a table to manage</p></div>
      <div style={{background:"#1a1208",color:"#d4952a",borderRadius:9,padding:"8px 14px",fontWeight:700,fontSize:13}}>{utilization}% full - {stats.guests}/{stats.capacity}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
      {[["Free",stats.free,"#10b981"],["Occupied",stats.occupied,"#dc2626"],["Reserved",stats.reserved,"#d4952a"],["Total",stats.total,"#1a1208"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:11,padding:"10px 8px",border:"1px solid #ede8de",textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600}}>{l}</div></div>)}
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,border:"1px solid #ede8de"}}>
      <div style={{position:"relative",width:"100%",height:380,background:"repeating-linear-gradient(45deg,#fafaf5,#fafaf5 10px,#f5f0e8 10px,#f5f0e8 20px)",borderRadius:10,border:"2px dashed #d4c9b8"}}>
        <div style={{position:"absolute",top:4,left:8,fontSize:10,color:"#aaa",fontWeight:700,letterSpacing:1}}>MAIN DINING</div>
        <div style={{position:"absolute",bottom:4,right:8,fontSize:10,color:"#aaa",fontWeight:700,letterSpacing:1}}>KITCHEN</div>
        {branchTables.map(tb=>{
          var isSel=selected===tb.id,c=colors[tb.status],bg=bgs[tb.status];
          var size=tb.seats<=2?44:tb.seats<=4?54:tb.seats<=6?64:74;
          return <button key={tb.id} onClick={()=>setSelected(tb.id)} style={{position:"absolute",left:tb.x+"%",top:tb.y+"%",width:size,height:size,borderRadius:tb.seats<=2?"50%":12,background:bg,border:"3px solid "+c,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"all .2s",transform:isSel?"scale(1.15)":"scale(1)",boxShadow:isSel?"0 4px 20px "+c+"88":"0 2px 6px rgba(0,0,0,.1)",zIndex:isSel?10:1,padding:0}}>
            <span style={{fontSize:14,fontWeight:700,color:c,lineHeight:1}}>T{tb.id}</span>
            <span style={{fontSize:9,color:c,fontWeight:600}}>{tb.seats} seats</span>
            {tb.status==="occupied"&&tb.guests&&<span style={{fontSize:9,color:c,fontWeight:700,marginTop:1}}>{tb.guests} in</span>}
          </button>;
        })}
      </div>
      <div style={{display:"flex",gap:14,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
        {[["Free","#10b981","#d1fae5"],["Occupied","#dc2626","#fee2e2"],["Reserved","#d4952a","#fef3c7"]].map(([l,c,bg])=><div key={l} style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:14,height:14,borderRadius:"50%",background:bg,border:"2px solid "+c,display:"inline-block"}}/><span style={{fontSize:11,color:"#8a8078",fontWeight:600}}>{l}</span></div>)}
      </div>
    </div>
    {t&&<div className="card fadeup" style={{borderLeft:"4px solid "+colors[t.status]}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:22,marginBottom:2}}>Table {t.id}</h3>
          <p style={{color:"#8a8078",fontSize:12}}>{t.seats} seats - currently <strong style={{color:colors[t.status],textTransform:"capitalize"}}>{t.status}</strong></p>
          {t.status==="occupied"&&<>
            <p style={{fontSize:12,color:"#8a8078",marginTop:3}}>Seated since {t.since} with {t.guests} guest{t.guests!==1?"s":""}</p>
            {tableOrders.length>0&&<p style={{fontSize:12,color:"#bf4626",fontWeight:700,marginTop:2}}>{tableOrders.length} unpaid order{tableOrders.length!==1?"s":""}</p>}
          </>}
          {t.status==="reserved"&&<p style={{fontSize:12,color:"#8a8078",marginTop:3}}>Reserved for <strong>{t.resName}</strong> at <strong>{t.resTime}</strong></p>}
        </div>
        <button onClick={()=>{setSelected(null);setPaymentStep(null);setPaidSplits([]);}} style={{color:"#ccc",fontSize:18,border:"none",background:"none",cursor:"pointer",padding:4}}>x</button>
      </div>

      {/* FREE TABLE */}
      {t.status==="free"&&<div>
        <p style={{fontSize:11,fontWeight:700,color:"#8a8078",letterSpacing:1,marginBottom:6}}>SEAT GUESTS</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(t.seats,8)+",1fr)",gap:5,marginBottom:10}}>
          {Array.from({length:t.seats}).map((_,i)=><button key={i} onClick={()=>setGuestCount(i+1)} style={{padding:"10px 4px",borderRadius:8,fontWeight:700,fontSize:14,background:guestCount===i+1?"#1a1208":"#f7f3ee",color:guestCount===i+1?"#fff":"#1a1208",border:"none",cursor:"pointer"}}>{i+1}</button>)}
        </div>
        <div style={{display:"flex",gap:7}}>
          <button className="btn btn-r" onClick={()=>seat(guestCount)} style={{flex:2,padding:"12px"}}>Seat {guestCount} guest{guestCount>1?"s":""}</button>
          <button className="btn btn-o" onClick={reserve} style={{flex:1,padding:"12px"}}>Reserve</button>
        </div>
      </div>}

      {/* OCCUPIED TABLE - RUNNING BILL */}
      {t.status==="occupied"&&!paymentStep&&<div>
        {allItems.length>0?<>
          <div style={{background:"#fafaf5",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #ede8de"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#8a8078",letterSpacing:1,marginBottom:8}}>RUNNING BILL</p>
            {allItems.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #ede8de",fontSize:13}}>
              <span>{it.name} <span style={{color:"#8a8078"}}>x{it.qty}</span></span>
              <span style={{fontWeight:700}}>{fmt((+it.price||0)*it.qty)}</span>
            </div>)}
            <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0 2px",fontSize:12,color:"#8a8078"}}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {totalDiscount>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12,color:"#dc2626",fontWeight:700}}>
              <span>Discount</span><span>- {fmt(totalDiscount)}</span>
            </div>}
            {serviceChargeT>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12,color:"#7c3aed",fontWeight:700}}>
              <span>Service ({tablesDeliv.serviceChargePercent}%)</span><span>+ {fmt(serviceChargeT)}</span>
            </div>}
            <div style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:11,color:"#8a8078"}}>
              <span>VAT incl. 20%</span><span>{fmt(vat)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",marginTop:6,borderTop:"2px solid #1a1208",fontWeight:700,fontSize:18}}>
              <span>TOTAL</span><span style={{color:"#bf4626"}}>{fmt(total)}</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <button className="btn btn-o" onClick={()=>onGoToPos&&onGoToPos(t.id)} style={{padding:"11px",fontSize:13}}>+ Add More Items</button>
            <button className="btn btn-o" onClick={()=>{
              var win=window.open("","","width=300,height=500");
              if(!win)return;
              var rows=allItems.map(i=>"<tr><td>"+i.name+" x"+i.qty+"</td><td style='text-align:right'>"+fmt((+i.price||0)*i.qty)+"</td></tr>").join("");
              win.document.write("<html><head><title>Bill - Table "+t.id+"</title><style>body{font-family:monospace;padding:12px;max-width:280px}h3{text-align:center}table{width:100%;border-collapse:collapse}td{padding:3px 0;border-bottom:1px dashed #ccc}.tot{font-weight:700;font-size:16px;border-top:2px solid #000;padding-top:8px;margin-top:8px}</style></head><body><h3>LA TAVOLA</h3><p style='text-align:center'>"+(branch?.name||"")+"</p><p>Table "+t.id+" - "+(t.guests||"?")+" guests</p><p>"+new Date().toLocaleString("en-GB")+"</p><hr/><table>"+rows+"</table><div class='tot'>Subtotal: "+fmt(subtotal)+"</div>"+(totalDiscount>0?"<div>Discount: -"+fmt(totalDiscount)+"</div>":"")+(serviceChargeT>0?"<div>Service ("+tablesDeliv.serviceChargePercent+"%): "+fmt(serviceChargeT)+"</div>":"")+"<div>VAT: "+fmt(vat)+"</div><div class='tot'>TOTAL: "+fmt(total)+"</div><p style='text-align:center;margin-top:20px'>Thank you!</p></body></html>");
              win.document.close();
              setTimeout(()=>win.print(),200);
            }} style={{padding:"11px",fontSize:13}}>Print Bill</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <button className="btn btn-d" onClick={()=>payAll("cash")} style={{padding:"13px",fontSize:14}}>Pay Cash {fmt(total)}</button>
            <button className="btn btn-p" onClick={()=>payAll("card")} style={{padding:"13px",fontSize:14}}>Pay Card {fmt(total)}</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setPaymentStep("split")} style={{flex:1,padding:"11px",fontSize:13,background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Split Bill</button>
            <button onClick={clearT} style={{flex:1,padding:"11px",fontSize:13,background:"#fff",color:"#dc2626",border:"2px solid #fee2e2",borderRadius:8,cursor:"pointer",fontWeight:700}}>Clear Without Pay</button>
          </div>
        </>:<div>
          <p style={{color:"#8a8078",fontSize:13,marginBottom:10,textAlign:"center",padding:"15px 0"}}>No orders yet for this table</p>
          <div style={{display:"flex",gap:7}}>
            <button className="btn btn-r" onClick={()=>onGoToPos&&onGoToPos(t.id)} style={{flex:2,padding:"12px"}}>Take Order</button>
            <button className="btn btn-d" onClick={clearT} style={{flex:1,padding:"12px"}}>Clear Table</button>
          </div>
        </div>}
      </div>}

      {/* SPLIT BILL UI */}
      {t.status==="occupied"&&paymentStep==="split"&&<div>
        <div style={{background:"#f5f3ff",borderRadius:10,padding:12,marginBottom:12,border:"2px solid #7c3aed"}}>
          <p style={{fontSize:12,fontWeight:700,color:"#7c3aed",marginBottom:4}}>SPLIT BILL - Total {fmt(total)}</p>
          <p style={{fontSize:11,color:"#8a8078"}}>Paid so far: {fmt(paidSplits.reduce((s,p)=>s+p.amount,0))} / Remaining: {fmt(total-paidSplits.reduce((s,p)=>s+p.amount,0))}</p>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["amount","By People"],["item","By Item"],["mixed","Mixed Cash+Card"]].map(([k,l])=><button key={k} onClick={()=>setSplitMode(k)} style={{flex:1,padding:"9px 4px",fontSize:11,fontWeight:700,background:splitMode===k?"#1a1208":"#fff",color:splitMode===k?"#fff":"#1a1208",border:"2px solid "+(splitMode===k?"#1a1208":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{l}</button>)}
        </div>

        {/* Split by amount */}
        {splitMode==="amount"&&<>
          <p style={{fontSize:11,fontWeight:700,color:"#8a8078",marginBottom:6}}>Number of people</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:12}}>
            {[2,3,4,5,6,8].map(n=><button key={n} onClick={()=>setSplitN(n)} style={{padding:"10px 4px",fontSize:13,fontWeight:700,background:splitN===n?"#7c3aed":"#fff",color:splitN===n?"#fff":"#1a1208",border:"2px solid "+(splitN===n?"#7c3aed":"#ede8de"),borderRadius:7,cursor:"pointer"}}>{n}</button>)}
          </div>
          <div style={{background:"#fafaf5",borderRadius:8,padding:12,marginBottom:12,textAlign:"center"}}>
            <p style={{fontSize:11,color:"#8a8078"}}>Each person pays</p>
            <p style={{fontSize:28,fontWeight:700,color:"#bf4626"}}>{fmt(total/splitN)}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <button className="btn btn-d" onClick={()=>paySplitPortion(total/splitN,"cash")} style={{padding:"12px",fontSize:13}}>Cash {fmt(total/splitN)}</button>
            <button className="btn btn-p" onClick={()=>paySplitPortion(total/splitN,"card")} style={{padding:"12px",fontSize:13}}>Card {fmt(total/splitN)}</button>
          </div>
        </>}

        {/* Split by item */}
        {splitMode==="item"&&<>
          <p style={{fontSize:11,fontWeight:700,color:"#8a8078",marginBottom:6}}>Tap items to select for this person</p>
          <div style={{maxHeight:220,overflowY:"auto",border:"1px solid #ede8de",borderRadius:8,marginBottom:10}}>
            {allItems.map((it,i)=><button key={i} onClick={()=>{
              setItemSplit(s=>({...s,[i]:!s[i]}));
            }} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:itemSplit[i]?"#f5f3ff":"#fff",border:"none",borderBottom:"1px solid #ede8de",cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:18,height:18,borderRadius:"50%",background:itemSplit[i]?"#7c3aed":"#ede8de",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{itemSplit[i]?EM.check:""}</span>
                <span style={{fontWeight:600,fontSize:13}}>{it.name} x{it.qty}</span>
              </div>
              <span style={{fontWeight:700,fontSize:13}}>{fmt((+it.price||0)*it.qty)}</span>
            </button>)}
          </div>
          {(()=>{
            var selectedTotal=allItems.reduce((s,it,i)=>s+(itemSplit[i]?(+it.price||0)*it.qty:0),0);
            return <>
              <div style={{background:"#fafaf5",borderRadius:8,padding:10,marginBottom:10,textAlign:"center"}}>
                <p style={{fontSize:11,color:"#8a8078"}}>This person pays</p>
                <p style={{fontSize:22,fontWeight:700,color:"#bf4626"}}>{fmt(selectedTotal)}</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <button className="btn btn-d" disabled={selectedTotal<=0} onClick={()=>{paySplitPortion(selectedTotal,"cash");setItemSplit({});}} style={{padding:"12px",fontSize:13}}>Cash {fmt(selectedTotal)}</button>
                <button className="btn btn-p" disabled={selectedTotal<=0} onClick={()=>{paySplitPortion(selectedTotal,"card");setItemSplit({});}} style={{padding:"12px",fontSize:13}}>Card {fmt(selectedTotal)}</button>
              </div>
            </>;
          })()}
        </>}

        {/* MIXED PAYMENT - Cash + Card for same customer */}
        {splitMode==="mixed"&&(()=>{
          var remaining=total-paidSplits.reduce((s,p)=>s+p.amount,0);
          var amt=parseFloat(customAmount)||0;
          var isValid=amt>0&&amt<=remaining+0.01;
          return <>
            <div style={{padding:"10px 12px",background:"#fffbeb",borderRadius:7,marginBottom:10,fontSize:11,color:"#92400e"}}>
              <strong>Mixed Payment:</strong> Enter how much to take, then tap Cash or Card. Repeat until full amount is paid.
            </div>
            <div style={{background:"#fafaf5",borderRadius:8,padding:12,marginBottom:10,textAlign:"center"}}>
              <p style={{fontSize:11,color:"#8a8078"}}>Remaining to pay</p>
              <p style={{fontSize:26,fontWeight:700,color:"#bf4626"}}>{fmt(remaining)}</p>
            </div>
            <label className="lbl">Amount to take now</label>
            <input type="number" step="0.01" className="field" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} placeholder="e.g. 50.00" style={{marginBottom:8,fontSize:18,padding:"12px",textAlign:"center",fontWeight:700}}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
              {[10,20,50,100].map(n=><button key={n} onClick={()=>setCustomAmount(String(Math.min(n,remaining)))} style={{padding:"9px 4px",fontSize:12,fontWeight:700,background:"#fff",border:"2px solid #ede8de",borderRadius:7,cursor:"pointer"}}>{EM.pound}{n}</button>)}
            </div>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <button onClick={()=>setCustomAmount(String(remaining.toFixed(2)))} style={{flex:1,padding:"8px",fontSize:11,fontWeight:700,background:"#f5f3ff",color:"#7c3aed",border:"2px solid #e9d5ff",borderRadius:7,cursor:"pointer"}}>Use remaining {fmt(remaining)}</button>
              <button onClick={()=>setCustomAmount(String((remaining/2).toFixed(2)))} style={{flex:1,padding:"8px",fontSize:11,fontWeight:700,background:"#f5f3ff",color:"#7c3aed",border:"2px solid #e9d5ff",borderRadius:7,cursor:"pointer"}}>Half {fmt(remaining/2)}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <button className="btn btn-d" disabled={!isValid} onClick={()=>{paySplitPortion(amt,"cash");setCustomAmount("");}} style={{padding:"13px",fontSize:14}}>Cash {fmt(amt)}</button>
              <button className="btn btn-p" disabled={!isValid} onClick={()=>{paySplitPortion(amt,"card");setCustomAmount("");}} style={{padding:"13px",fontSize:14}}>Card {fmt(amt)}</button>
            </div>
            {amt>remaining&&<p style={{color:"#dc2626",fontSize:11,marginTop:6,textAlign:"center",fontWeight:700}}>Amount exceeds remaining balance</p>}
          </>;
        })()}

        {paidSplits.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#d1fae5",borderRadius:7}}>
          <p style={{fontSize:11,fontWeight:700,color:"#065f46",marginBottom:4}}>PAYMENTS RECEIVED</p>
          {paidSplits.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#065f46"}}><span>{i+1}. {p.method} at {p.at}</span><span style={{fontWeight:700}}>{fmt(p.amount)}</span></div>)}
        </div>}

        <button onClick={()=>{setPaymentStep(null);setPaidSplits([]);setItemSplit({});setCustomAmount("");}} style={{marginTop:10,width:"100%",padding:"9px",fontSize:12,background:"none",color:"#8a8078",border:"1px solid #ede8de",borderRadius:7,cursor:"pointer",fontWeight:700}}>Cancel Split</button>
      </div>}

      {/* RESERVED TABLE */}
      {t.status==="reserved"&&<div style={{display:"flex",gap:7}}>
        <button className="btn btn-r" onClick={()=>seat(2)} style={{flex:2,padding:"12px"}}>Check in guests</button>
        <button className="btn btn-o" onClick={clearT} style={{flex:1,padding:"12px"}}>Cancel reservation</button>
      </div>}
    </div>}
  </div>;
}

// -- POSTCODE LOOKUP (UK) -----------------------------------------------------
// Uses free postcodes.io API - no key needed, unlimited calls
// Returns {ok, town, area, district, lat, lng, distance}
function lookupPostcode(postcode, branchLat, branchLng){
  var clean=postcode.replace(/\s+/g,"").toUpperCase();
  if(!clean)return Promise.resolve({ok:false,reason:"Enter a postcode"});
  return fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(clean))
    .then(r=>r.json())
    .then(j=>{
      if(j.status!==200)return{ok:false,reason:"Postcode not found"};
      var r=j.result;
      var distance=null;
      if(branchLat&&branchLng){
        var toRad=d=>d*Math.PI/180;
        var dLat=toRad(r.latitude-branchLat),dLng=toRad(r.longitude-branchLng);
        var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(branchLat))*Math.cos(toRad(r.latitude))*Math.sin(dLng/2)*Math.sin(dLng/2);
        distance=2*3959*Math.asin(Math.sqrt(a));
      }
      return{ok:true,town:r.admin_ward||r.parish||r.admin_district,area:r.region,district:r.admin_district,country:r.country,lat:r.latitude,lng:r.longitude,distance};
    })
    .catch(()=>({ok:false,reason:"Lookup failed - check internet"}));
}

// -- CUSTOMER DATABASE --------------------------------------------------------
// eslint-disable-next-line no-unused-vars
var CUSTOMERS0=[
  {id:"c1",phone:"07700900001",name:"John Smith",address:{line1:"45 Oxford Street",postcode:"E14 5AB",notes:"Flat 3B, buzzer broken"},distance:2.1,lastOrder:"ORD-1002",totalOrders:8,totalSpent:187.50,notes:"Allergic to nuts"},
  {id:"c2",phone:"07700900002",name:"Sarah Williams",address:{line1:"12 Camden Road",postcode:"N1 9AA",notes:"Green door"},distance:4.3,lastOrder:null,totalOrders:3,totalSpent:62.80,notes:"Prefers extra spicy"},
  {id:"c3",phone:"07700900003",name:"Raj Patel",address:{line1:"88 Brick Lane",postcode:"E1 6RL",notes:""},distance:0.8,lastOrder:"ORD-1004",totalOrders:15,totalSpent:412.30,notes:"VIP - regular customer"},
];

// -- PHONE ORDER VIEW ---------------------------------------------------------
function PhoneOrderV({customers,setCustomers,menu,onOrder,push,user,branch,orders}){
  var [phone,setPhone]=useState("");
  var [found,setFound]=useState(null);
  // eslint-disable-next-line no-unused-vars
  var [searched,setSearched]=useState(false);
  var [step,setStep]=useState("search");
  var [newCust,setNewCust]=useState({name:"",line1:"",postcode:"",notes:"",distance:0});
  var [orderType,setOrderType]=useState("delivery");
  var [cart,setCart]=useState([]);
  var [cat,setCat]=useState("");
  var [flashId,setFlashId]=useState(null);
  var [lookingUp,setLookingUp]=useState(false);
  var [lookupResult,setLookupResult]=useState(null);
  var [searchTerm,setSearchTerm]=useState("");
  var [orderNotes,setOrderNotes]=useState("");
  var [editNoteId,setEditNoteId]=useState(null);
  var cats=[...new Set(menu.filter(i=>i.avail).map(i=>i.cat))];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!cat&&cats.length)setCat(cats[0]);},[cat]);

  var doLookup=()=>{
    if(!newCust.postcode.trim())return;
    setLookingUp(true);setLookupResult(null);
    lookupPostcode(newCust.postcode,branch?.lat,branch?.lng).then(r=>{
      setLookupResult(r);
      setLookingUp(false);
      if(r.ok&&r.distance!==null){
        setNewCust(c=>({...c,distance:r.distance.toFixed(1)}));
      }
    });
  };

  var search=()=>{
    var clean=phone.replace(/\s+/g,"").replace(/^0/,"").replace(/^\+?44/,"0");
    var full=clean.startsWith("0")?clean:"0"+clean;
    var c=customers.find(x=>x.phone.replace(/\s+/g,"")===full);
    setFound(c||null);
    setSearched(true);
    if(c)setStep("existing");else setStep("new");
  };

  var createCustomer=()=>{
    if(!newCust.name.trim()){alert("Name required");return;}
    var c={id:"c"+Date.now(),phone:phone,name:newCust.name,address:{line1:newCust.line1,postcode:newCust.postcode,notes:newCust.notes},distance:+newCust.distance||0,lastOrder:null,totalOrders:0,totalSpent:0,notes:""};
    setCustomers(cs=>[...cs,c]);
    // Save to DB
    dbSaveCustomer({phone:phone,name:newCust.name,address:c.address,distance:c.distance,notes:""}).then(r=>{
      if(r.data&&r.data.id){
        // Update local with real DB id
        setCustomers(cs=>cs.map(x=>x.id===c.id?{...x,id:r.data.id,dbId:r.data.id}:x));
        setFound(prev=>prev&&prev.id===c.id?{...prev,id:r.data.id,dbId:r.data.id}:prev);
      }
    }).catch(e=>console.log("Customer save failed (kept locally):",e));
    setFound(c);
    setStep("ordering");
    push({title:"Customer added",body:c.name,color:"#059669"});
  };

  var addItem=it=>{
    var typePrice=getItemPrice(it,orderType);
    setCart(c=>{var ex=c.find(x=>x.id===it.id);return ex?c.map(x=>x.id===it.id?{...x,qty:x.qty+1,price:typePrice}:x):[...c,{id:it.id,name:it.name,qty:1,price:typePrice,note:""}];});
    setFlashId(it.id);setTimeout(()=>setFlashId(null),600);
  };
  var decItem=id=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));
  var delItem=id=>setCart(c=>c.filter(x=>x.id!==id));
  var setItemNote=(id,note)=>setCart(c=>c.map(x=>x.id===id?{...x,note:note}:x));

  // Reorder last - copy items from last order to cart
  var reorderLast=()=>{
    if(!found)return;
    var lastOrder=orders.filter(o=>o.userId===found.id||o.phone===found.phone).sort((a,b)=>{
      var ta=new Date(a.created_at||a.time||0).getTime()||0;
      var tb=new Date(b.created_at||b.time||0).getTime()||0;
      return tb-ta;
    })[0];
    if(!lastOrder||!lastOrder.items||!lastOrder.items.length){
      push({title:"No previous order",body:"This customer has not ordered before",color:"#dc2626"});
      return;
    }
    var newCart=lastOrder.items.map(it=>{
      var m=menu.find(x=>String(x.id)===String(it.id)||x.name===it.name);
      var typePrice=m?getItemPrice(m,orderType):it.price;
      return {id:it.id,name:it.name,qty:it.qty,price:typePrice,note:""};
    });
    setCart(newCart);
    push({title:"Last order added",body:newCart.length+" items added to cart",color:"#059669"});
  };

  // Find customer's last order
  var lastOrder=found?orders.filter(o=>o.userId===found.id||o.phone===found.phone).sort((a,b)=>{
    var ta=new Date(a.created_at||a.time||0).getTime()||0;
    var tb=new Date(b.created_at||b.time||0).getTime()||0;
    return tb-ta;
  })[0]:null;

  var subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  var deliveryCheck=orderType==="delivery"&&found?checkDelivery(branch,{...found.address,distance:found.distance},subtotal):null;
  var deliveryFee=deliveryCheck?.fee||0;
  var total=subtotal+deliveryFee;

  var placeOrder=(paid)=>{
    if(!cart.length)return;
    if(orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok){alert(deliveryCheck.reason);return;}
    var o={id:uid(),branchId:branch?.id,userId:found.id,customer:found.name+" ("+found.phone+")",phone:found.phone,items:cart,subtotal,deliveryFee,total,status:"preparing",time:nowT(),type:orderType==="delivery"?"delivery":orderType==="collection"?"collection":"dine-in",paid,address:orderType==="delivery"?found.address:null,takenBy:user?.name,source:"phone",notes:orderNotes||""};
    onOrder(o);
    setCustomers(cs=>cs.map(c=>c.id===found.id?{...c,lastOrder:o.id,totalOrders:c.totalOrders+1,totalSpent:c.totalSpent+total}:c));
    push({title:"Phone order placed!",body:o.id+" - "+fmt(total),color:"#059669"});
    setPhone("");setFound(null);setSearched(false);setStep("search");setCart([]);setNewCust({name:"",line1:"",postcode:"",notes:"",distance:0});setOrderNotes("");
  };

  // Step 1: Search by phone
  if(step==="search") return <div className="page" style={{maxWidth:500}}>
    <h2 style={{fontSize:24,marginBottom:4}}>Phone Order</h2>
    <p style={{color:"#8a8078",fontSize:13,marginBottom:20}}>Enter customer's phone number</p>
    <div className="card" style={{marginBottom:12}}>
      <label className="lbl">Customer Phone Number</label>
      <input className="field" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="07700 900 000" style={{fontSize:22,padding:"14px 16px",textAlign:"center",fontWeight:700,letterSpacing:1}} autoFocus/>
      <button className="btn btn-r" onClick={search} disabled={phone.length<5} style={{width:"100%",padding:"12px",marginTop:10,fontSize:15}}>Search Customer</button>
    </div>
    <div style={{padding:"12px 14px",background:"#fffbeb",borderRadius:9,border:"1px solid #fde68a",fontSize:12,color:"#92400e"}}>
      <strong>Tip:</strong> Type the number your customer is calling from. If they're new, you can register them. If returning, you will see their history and last order.
    </div>
  </div>;

  // Step 2: Existing customer found
  if(step==="existing"&&found) return <div className="page" style={{maxWidth:560}}>
    <button className="btn btn-g" onClick={()=>{setStep("search");setFound(null);setPhone("");setSearched(false);}} style={{marginBottom:10,fontSize:13}}>{"< Back"}</button>
    <div className="card" style={{marginBottom:14,background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none"}}>
      <p style={{fontSize:11,opacity:.8,letterSpacing:1,marginBottom:3}}>{EM.check} EXISTING CUSTOMER</p>
      <h2 style={{fontSize:26,color:"#fff",marginBottom:4}}>{found.name}</h2>
      <p style={{fontSize:13,opacity:.9}}>{found.phone}</p>
      {found.notes&&<p style={{fontSize:12,opacity:.9,marginTop:6,padding:"5px 9px",background:"rgba(0,0,0,.15)",borderRadius:6}}>{EM.star} {found.notes}</p>}
    </div>

    <div className="g3" style={{marginBottom:12}}>
      {[["Orders",found.totalOrders,"#2563eb"],["Spent",fmt(found.totalSpent),"#059669"],["Distance",found.distance?found.distance.toFixed(1)+" mi":"-","#d97706"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:11,padding:"12px 8px",textAlign:"center",border:"1px solid #ede8de"}}><div style={{fontWeight:700,fontSize:16,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600,textTransform:"uppercase"}}>{l}</div></div>)}
    </div>

    <div className="card" style={{marginBottom:12}}>
      <p style={{fontWeight:700,fontSize:13,marginBottom:8}}>{EM.pin} Address</p>
      <p style={{fontSize:14,marginBottom:2}}>{found.address.line1}</p>
      <p style={{fontSize:14,color:"#8a8078"}}>{found.address.postcode}</p>
      {found.address.notes&&<p style={{fontSize:12,color:"#8a8078",fontStyle:"italic",marginTop:4}}>{found.address.notes}</p>}
    </div>

    {found.lastOrder&&<button className="btn btn-p" onClick={reorderLast} style={{width:"100%",padding:"14px",fontSize:15,marginBottom:10}}>
      Would you like your last order? ({found.lastOrder})
    </button>}

    <button className="btn btn-r" onClick={()=>setStep("ordering")} style={{width:"100%",padding:"14px",fontSize:15}}>
      Start New Order
    </button>
  </div>;

  // Step 3: New customer
  if(step==="new") return <div className="page" style={{maxWidth:500}}>
    <button className="btn btn-g" onClick={()=>{setStep("search");setPhone("");setSearched(false);}} style={{marginBottom:10,fontSize:13}}>{"< Back"}</button>
    <div className="card" style={{marginBottom:14,background:"#fef3c7",border:"2px solid #fcd34d"}}>
      <p style={{fontSize:11,letterSpacing:1,color:"#92400e",fontWeight:700,marginBottom:3}}>NEW CUSTOMER</p>
      <p style={{fontSize:14,color:"#92400e"}}>No customer found for <strong>{phone}</strong></p>
      <p style={{fontSize:12,color:"#92400e",marginTop:4}}>Type postcode below to auto-fill area</p>
    </div>

    <div className="card">
      <label className="lbl">Name *</label>
      <input className="field" value={newCust.name} onChange={e=>setNewCust({...newCust,name:e.target.value})} placeholder="John Smith" style={{marginBottom:10}}/>

      <label className="lbl">Phone (confirmed)</label>
      <input className="field" value={phone} readOnly style={{background:"#f7f3ee",marginBottom:12}}/>

      {/* Postcode lookup */}
      <label className="lbl">Postcode - auto lookup</label>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <input className="field" value={newCust.postcode} onChange={e=>setNewCust({...newCust,postcode:e.target.value.toUpperCase()})} onKeyDown={e=>e.key==="Enter"&&doLookup()} placeholder="E14 5AB" style={{flex:1,fontSize:16,letterSpacing:1}}/>
        <button onClick={doLookup} disabled={lookingUp||!newCust.postcode} style={{padding:"0 18px",background:lookingUp?"#8a8078":"#1a1208",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          {lookingUp?"...":"Find"}
        </button>
      </div>

      {/* Lookup result */}
      {lookupResult&&lookupResult.ok&&<div style={{padding:"10px 12px",background:"#d1fae5",border:"2px solid #059669",borderRadius:8,marginBottom:10,fontSize:12}}>
        <p style={{fontWeight:700,color:"#065f46",marginBottom:3}}>{EM.check} {lookupResult.town}, {lookupResult.district}</p>
        {lookupResult.distance!==null&&<p style={{color:"#065f46"}}>{lookupResult.distance.toFixed(1)} miles from branch</p>}
      </div>}
      {lookupResult&&!lookupResult.ok&&<div style={{padding:"10px 12px",background:"#fee2e2",border:"2px solid #dc2626",borderRadius:8,marginBottom:10,fontSize:12,color:"#991b1b",fontWeight:700}}>
        {EM.cross} {lookupResult.reason}
      </div>}

      <label className="lbl">House number + Street</label>
      <input className="field" value={newCust.line1} onChange={e=>setNewCust({...newCust,line1:e.target.value})} placeholder="45 Oxford Street" style={{marginBottom:10}}/>

      <label className="lbl">Delivery Notes</label>
      <input className="field" value={newCust.notes} onChange={e=>setNewCust({...newCust,notes:e.target.value})} placeholder="Flat 3B, buzzer broken" style={{marginBottom:14}}/>

      <button className="btn btn-r" onClick={createCustomer} disabled={!newCust.name.trim()||!newCust.postcode} style={{width:"100%",padding:"13px"}}>
        Save Customer & Start Order
      </button>
    </div>
  </div>;

  // Step 4: Ordering - REDESIGNED
  // Build search-filtered list
  var menuItems=(()=>{
    var seen=new Set();
    var q=searchTerm.trim().toLowerCase();
    return menu.filter(i=>{
      if(!i.avail)return false;
      if(!isItemAvailable(i,orderType))return false;
      if(q){
        var hay=(i.name+" "+(i.desc||"")+" "+(i.cat||"")).toLowerCase();
        return hay.includes(q);
      }
      return i.cat===cat;
    }).filter(i=>{
      var key=(i.name||"").toLowerCase().trim()+"|"+(i.cat||"");
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  })();

  return <div className="page" style={{maxWidth:1200,padding:14}}>
    <button className="btn btn-g" onClick={()=>setStep("existing")} style={{marginBottom:10,fontSize:12,padding:"6px 12px"}}>{"< Back to customer"}</button>

    {/* Premium Customer Header */}
    <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",borderRadius:14,padding:"14px 18px",marginBottom:10,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div style={{flex:1,minWidth:200}}>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:3,color:"#fff"}}>{found.name}</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,.7)",marginBottom:6}}>{EM.phone} {found.phone}</p>
          {orderType==="delivery"&&found.address&&<p style={{fontSize:12,color:"rgba(255,255,255,.85)",marginBottom:4}}>{EM.pin} {found.address.line1||"No address"}{found.address.postcode?", "+found.address.postcode:""}{found.distance?" - "+(typeof found.distance==="number"?found.distance.toFixed(1):found.distance)+" mi":""}</p>}
          {(found.totalOrders>0||found.totalSpent>0)&&<p style={{fontSize:11,color:"#d4952a",fontWeight:700,marginTop:4}}>{found.totalOrders||0} previous orders - {fmt(found.totalSpent||0)} total spent</p>}
        </div>
        <div style={{display:"flex",gap:5}}>
          {[["delivery","Delivery"],["collection","Collection"]].map(([t,l])=><button key={t} onClick={()=>setOrderType(t)} style={{padding:"9px 16px",borderRadius:8,fontWeight:700,fontSize:12,background:orderType===t?"#bf4626":"rgba(255,255,255,.1)",color:"#fff",border:"2px solid "+(orderType===t?"#bf4626":"rgba(255,255,255,.2)"),cursor:"pointer"}}>{l}</button>)}
        </div>
      </div>

      {lastOrder&&cart.length===0&&<div style={{marginTop:11,paddingTop:11,borderTop:"1px solid rgba(255,255,255,.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
          <div>
            <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:1,marginBottom:2}}>LAST ORDER</p>
            <p style={{fontSize:12,color:"rgba(255,255,255,.85)"}}>{(lastOrder.items||[]).map(i=>i.name+" x"+i.qty).slice(0,3).join(", ")}{(lastOrder.items||[]).length>3?", +"+((lastOrder.items||[]).length-3)+" more":""}</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>{fmt(lastOrder.total||0)} - {lastOrder.time||"recent"}</p>
          </div>
          <button onClick={reorderLast} style={{padding:"9px 14px",borderRadius:7,fontSize:12,fontWeight:700,background:"#d4952a",color:"#1a1208",border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>{String.fromCharCode(0x21BB)} Reorder Same</button>
        </div>
      </div>}
    </div>

    {/* Delivery status */}
    {orderType==="delivery"&&deliveryCheck&&<div style={{marginBottom:10,padding:"10px 14px",borderRadius:9,background:deliveryCheck.ok?"#d1fae5":"#fee2e2",border:"2px solid "+(deliveryCheck.ok?"#059669":"#dc2626"),fontSize:13,fontWeight:700,color:deliveryCheck.ok?"#065f46":"#991b1b",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
      <span>{deliveryCheck.ok?(EM.check+" Delivery OK"+(deliveryCheck.zone?" - "+deliveryCheck.zone:"")):(EM.cross+" "+deliveryCheck.reason)}</span>
      {deliveryCheck.ok&&<span style={{fontSize:14}}>{deliveryCheck.fee===0?"FREE DELIVERY":fmt(deliveryCheck.fee)+" fee"}</span>}
    </div>}

    {/* Two-column main area */}
    <div style={{display:"grid",gridTemplateColumns:cart.length?"1.5fr 380px":"1fr",gap:12}}>
      {/* LEFT: Menu */}
      <div>
        {/* Search bar */}
        <div style={{position:"relative",marginBottom:10}}>
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search items..." className="field" style={{paddingLeft:32,fontSize:13}}/>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#8a8078"}}>{String.fromCharCode(0xD83D,0xDD0D)}</span>
          {searchTerm&&<button onClick={()=>setSearchTerm("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"#ede8de",border:"none",width:24,height:24,borderRadius:12,cursor:"pointer",fontWeight:700,color:"#8a8078"}}>x</button>}
        </div>

        {/* Categories */}
        {!searchTerm&&<div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
          {cats.map(c=>{
            var count=menu.filter(m=>m.cat===c&&m.avail&&isItemAvailable(m,orderType)).length;
            return <button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap",padding:"9px 14px",borderRadius:9,fontWeight:700,fontSize:12,border:"2px solid",borderColor:cat===c?"#1a1208":"#ede8de",background:cat===c?"#1a1208":"#fff",color:cat===c?"#d4952a":"#1a1208",cursor:"pointer",flexShrink:0,transition:"all .15s"}}>{c} <span style={{fontSize:10,opacity:.7,marginLeft:3}}>{count}</span></button>;
          })}
        </div>}

        {/* Menu grid - bigger cards */}
        {menuItems.length===0?<div className="card" style={{textAlign:"center",padding:30,color:"#8a8078"}}>
          <p style={{fontSize:30,marginBottom:8}}>{EM.cook}</p>
          <p style={{fontSize:13}}>{searchTerm?"No items match \""+searchTerm+"\"":"No items in "+cat}</p>
        </div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
          {menuItems.map(item=>{
            var inCart=cart.find(c=>c.id===item.id);
            var displayPrice=getItemPrice(item,orderType);
            return <button key={item.dbId||item.id} onClick={()=>addItem(item)} disabled={item.stock===0} style={{background:inCart?"linear-gradient(135deg,#fff5f3,#fff)":"#fff",border:"2px solid "+(inCart?"#bf4626":"transparent"),borderRadius:11,padding:"14px 10px",cursor:item.stock===0?"not-allowed":"pointer",opacity:item.stock===0?.4:1,boxShadow:inCart?"0 6px 18px rgba(191,70,38,.25)":"0 2px 8px rgba(0,0,0,.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:5,position:"relative",minHeight:130,transition:"all .15s"}}>
              {inCart&&<div style={{position:"absolute",top:-7,right:-7,background:"#bf4626",color:"#fff",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,border:"2px solid #fff",boxShadow:"0 2px 6px rgba(191,70,38,.4)"}}>{inCart.qty}</div>}
              <span style={{fontSize:34}}>{EM[item.icon]||""}</span>
              <p style={{fontSize:12,fontWeight:700,textAlign:"center",lineHeight:1.25}}>{item.name}</p>
              <p style={{fontSize:14,fontWeight:700,color:"#bf4626"}}>{fmt(displayPrice)}</p>
            </button>;
          })}
        </div>}
      </div>

      {/* RIGHT: Cart */}
      {cart.length>0&&<div style={{position:"sticky",top:14,alignSelf:"flex-start"}}>
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          {/* Cart header */}
          <div style={{background:"#1a1208",color:"#fff",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{fontSize:13,fontWeight:700}}>Order Summary</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>{cart.reduce((s,i)=>s+i.qty,0)} items - {orderType==="delivery"?"Delivery":"Collection"}</p>
            </div>
            <button onClick={()=>setCart([])} style={{padding:"5px 10px",fontSize:11,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,cursor:"pointer",fontWeight:700}}>Clear</button>
          </div>

          {/* Cart items */}
          <div style={{maxHeight:380,overflowY:"auto",padding:"8px 12px"}}>
            {cart.map(it=><div key={it.id} className={flashId===it.id?"flash":""} style={{padding:"9px 0",borderBottom:"1px solid #f5f0e8"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.name}</p>
                  <p style={{fontSize:11,color:"#8a8078"}}>{fmt(it.price)} each</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,background:"#f7f3ee",borderRadius:18,padding:"3px 6px"}}>
                  <button onClick={()=>decItem(it.id)} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,color:"#bf4626",lineHeight:1}}>-</button>
                  <span style={{fontWeight:700,minWidth:18,textAlign:"center",fontSize:13}}>{it.qty}</span>
                  <button onClick={()=>addItem(it)} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,color:"#059669",lineHeight:1}}>+</button>
                </div>
                <p style={{fontWeight:700,fontSize:13,color:"#bf4626",minWidth:54,textAlign:"right"}}>{fmt(it.price*it.qty)}</p>
                <button onClick={()=>delItem(it.id)} style={{width:22,height:22,borderRadius:"50%",border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontWeight:700,fontSize:11}}>x</button>
              </div>
              {/* Item note */}
              {editNoteId===it.id?<input autoFocus value={it.note||""} onChange={e=>setItemNote(it.id,e.target.value)} onBlur={()=>setEditNoteId(null)} placeholder="No onions, extra spicy..." style={{width:"100%",marginTop:6,padding:"6px 9px",fontSize:11,border:"2px solid #d4952a",borderRadius:6}}/>:it.note?<div onClick={()=>setEditNoteId(it.id)} style={{marginTop:5,padding:"4px 8px",background:"#fef3c7",borderRadius:5,fontSize:10,color:"#92400e",cursor:"pointer",fontStyle:"italic"}}>Note: {it.note} (tap to edit)</div>:<button onClick={()=>setEditNoteId(it.id)} style={{marginTop:5,padding:"3px 7px",fontSize:10,background:"transparent",color:"#8a8078",border:"1px dashed #ddd",borderRadius:4,cursor:"pointer"}}>+ Add note</button>}
            </div>)}
          </div>

          {/* Order notes */}
          <div style={{padding:"8px 12px",borderTop:"1px solid #ede8de",background:"#fafaf5"}}>
            <p style={{fontSize:11,fontWeight:700,marginBottom:5,color:"#8a8078",letterSpacing:1}}>ORDER NOTES (OPTIONAL)</p>
            <textarea value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} placeholder="Special delivery instructions, gate code, etc." style={{width:"100%",minHeight:50,padding:"7px 9px",border:"1px solid #ede8de",borderRadius:6,fontSize:12,fontFamily:"inherit",resize:"vertical"}}/>
          </div>

          {/* Totals */}
          <div style={{padding:"10px 14px",background:"#fafaf5",borderTop:"1px solid #ede8de"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8a8078",marginBottom:3}}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {orderType==="delivery"&&deliveryFee>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8a8078",marginBottom:3}}><span>Delivery</span><span>{fmt(deliveryFee)}</span></div>}
            {orderType==="delivery"&&deliveryCheck?.ok&&deliveryFee===0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#059669",marginBottom:3,fontWeight:700}}><span>Delivery</span><span>FREE</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:20,marginTop:6,paddingTop:6,borderTop:"2px solid #ede8de"}}><span>Total</span><span style={{color:"#bf4626"}}>{fmt(total)}</span></div>
          </div>

          {/* Action buttons */}
          <div style={{padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <button disabled={orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok} onClick={()=>placeOrder(true)} style={{padding:"13px",fontSize:13,fontWeight:700,background:"#059669",color:"#fff",border:"none",borderRadius:9,cursor:orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok?"not-allowed":"pointer",opacity:orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok?.5:1}}>{EM.check} Customer Paid</button>
            <button disabled={orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok} onClick={()=>placeOrder(false)} style={{padding:"13px",fontSize:13,fontWeight:700,background:"#bf4626",color:"#fff",border:"none",borderRadius:9,cursor:orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok?"not-allowed":"pointer",opacity:orderType==="delivery"&&deliveryCheck&&!deliveryCheck.ok?.5:1}}>{EM.pound} Cash on Delivery</button>
          </div>
        </div>
      </div>}
    </div>
  </div>;
}

// -- POS (EPOS for Staff) -----------------------------------------------------
// -- STAFF BOOKINGS DASHBOARD ----------------------------------------------
function StaffBookingsV({branch,push}){
  var [bookings,setBookings]=useState([]);
  var [filter,setFilter]=useState("today");
  var [loading,setLoading]=useState(true);
  var seenBookingIdsRef=useRef(new Set());
  var initialBookingLoadRef=useRef(true);
  var [soundOn,setSoundOn]=useState(()=>{try{return localStorage.getItem("booking_sound")!=="0";}catch(e){return true;}});
  var today=new Date().toISOString().split("T")[0];
  var tomorrow=new Date(Date.now()+86400000).toISOString().split("T")[0];
  var weekAhead=new Date(Date.now()+7*86400000).toISOString().split("T")[0];

  // Sound for new bookings
  var playBookingDing=useCallback(()=>{
    if(!soundOn)return;
    try{
      var AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      var ctx=new AudioCtx();
      var osc=ctx.createOscillator();
      var gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";
      osc.frequency.setValueAtTime(660,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.2);
      gain.gain.setValueAtTime(0.3,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime+0.5);
    }catch(e){}
  },[soundOn]);

  var refresh=useCallback((isAuto)=>{
    if(!isAuto)setLoading(true);
    var from=today,to=today;
    if(filter==="tomorrow"){from=tomorrow;to=tomorrow;}
    else if(filter==="week"){from=today;to=weekAhead;}
    else if(filter==="past"){from="2020-01-01";to=today;}
    dbFetchReservations(branch?.id,from,to).then(data=>{
      var fresh=data||[];
      // Detect new bookings (by ID we've never seen)
      if(initialBookingLoadRef.current){
        fresh.forEach(b=>seenBookingIdsRef.current.add(b.id));
        initialBookingLoadRef.current=false;
      }else{
        var newOnes=fresh.filter(b=>!seenBookingIdsRef.current.has(b.id));
        if(newOnes.length>0){
          newOnes.forEach(b=>seenBookingIdsRef.current.add(b.id));
          playBookingDing();
          var latest=newOnes[0];
          push({title:"New booking!",body:latest.customer_name+" - "+latest.guests+" guests at "+latest.reservation_time,color:"#7c3aed"});
          // Browser notification
          if(typeof window!=="undefined"&&"Notification" in window&&Notification.permission==="granted"){
            try{
              var n=new Notification(String.fromCharCode(0xD83D,0xDCC5)+" New Booking - La Tavola",{
                body:latest.customer_name+" booked "+latest.guests+" guests at "+latest.reservation_time,
                tag:"booking-"+latest.id,
              });
              setTimeout(()=>n.close(),8000);
            }catch(e){}
          }
        }
      }
      setBookings(fresh);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[branch,filter,playBookingDing,push]);

  useEffect(()=>{refresh();},[refresh]);

  // Auto-refresh every 15 seconds to catch new bookings
  useEffect(()=>{
    var interval=setInterval(()=>refresh(true),15000);
    return()=>clearInterval(interval);
  },[refresh]);

  // Request notification permission once
  useEffect(()=>{
    if(typeof window!=="undefined"&&"Notification" in window&&Notification.permission==="default"){
      Notification.requestPermission();
    }
  },[]);

  var toggleSound=()=>{
    var v=!soundOn;setSoundOn(v);
    try{localStorage.setItem("booking_sound",v?"1":"0");}catch(e){}
    if(v)playBookingDing();
  };

  var checkIn=b=>{
    dbUpdateReservationStatus(b.id,"arrived").then(r=>{
      if(r.error){push({title:"Update failed",body:r.error.message,color:"#dc2626"});return;}
      push({title:"Checked in",body:b.customer_name+" arrived",color:"#059669"});
      refresh();
    });
  };
  var noShow=b=>{
    if(!window.confirm("Mark "+b.customer_name+" as no-show?"))return;
    dbUpdateReservationStatus(b.id,"no-show").then(()=>{refresh();push({title:"Marked no-show",body:b.customer_name,color:"#dc2626"});});
  };
  var cancel=b=>{
    if(!window.confirm("Cancel booking for "+b.customer_name+"?"))return;
    dbUpdateReservationStatus(b.id,"cancelled").then(()=>{refresh();push({title:"Booking cancelled",body:b.customer_name,color:"#dc2626"});});
  };

  var grouped={};
  bookings.forEach(b=>{
    var key=b.reservation_date;
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(b);
  });
  Object.keys(grouped).forEach(k=>grouped[k].sort((a,b)=>a.reservation_time.localeCompare(b.reservation_time)));

  var statusColor={confirmed:"#2563eb",arrived:"#059669","no-show":"#dc2626",cancelled:"#8a8078"};
  var statusBg={confirmed:"#dbeafe",arrived:"#d1fae5","no-show":"#fee2e2",cancelled:"#f5f5f5"};

  var stats={
    total:bookings.length,
    today:bookings.filter(b=>b.reservation_date===today&&b.status!=="cancelled").length,
    arrived:bookings.filter(b=>b.status==="arrived").length,
    pending:bookings.filter(b=>b.status==="confirmed"&&b.reservation_date===today).length,
  };

  return <div className="page">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:22,marginBottom:2}}>Bookings</h2><p style={{color:"#8a8078",fontSize:12}}>{branch?.name} - auto-refreshes every 15 sec</p></div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button onClick={toggleSound} title={soundOn?"Sound on":"Sound off"} style={{padding:"8px 11px",fontSize:14,background:soundOn?"#d1fae5":"#f5f5f5",color:soundOn?"#065f46":"#999",border:"2px solid "+(soundOn?"#059669":"#ddd"),borderRadius:8,cursor:"pointer",fontWeight:700}}>{soundOn?String.fromCharCode(0xD83D,0xDD0A):String.fromCharCode(0xD83D,0xDD07)}</button>
        <button onClick={()=>refresh(false)} style={{padding:"8px 14px",fontSize:12,background:"#1a1208",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Refresh</button>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      {[["Today",stats.today,"#2563eb"],["Arrived",stats.arrived,"#059669"],["Pending",stats.pending,"#d4952a"],["Total",stats.total,"#1a1208"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:11,padding:"10px 8px",border:"1px solid #ede8de",textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600}}>{l}</div></div>)}
    </div>

    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
      {[["today","Today"],["tomorrow","Tomorrow"],["week","Next 7 days"],["past","Past"]].map(([k,l])=><button key={k} onClick={()=>setFilter(k)} style={{padding:"8px 14px",fontSize:12,fontWeight:700,background:filter===k?"#bf4626":"#fff",color:filter===k?"#fff":"#1a1208",border:"2px solid "+(filter===k?"#bf4626":"#ede8de"),borderRadius:8,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>)}
    </div>

    {loading&&<p style={{textAlign:"center",color:"#8a8078",padding:20,fontSize:13}}>Loading bookings...</p>}
    {!loading&&bookings.length===0&&<div className="card" style={{textAlign:"center",padding:30}}>
      <p style={{fontSize:40,marginBottom:10}}>{EM.cal}</p>
      <p style={{fontSize:14,color:"#8a8078"}}>No bookings for this period</p>
    </div>}

    {Object.keys(grouped).sort().map(date=><div key={date} style={{marginBottom:20}}>
      <h3 style={{fontSize:14,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:8,paddingBottom:6,borderBottom:"2px solid #ede8de"}}>
        {new Date(date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
        <span style={{float:"right",color:"#bf4626",fontSize:12}}>{grouped[date].length} booking{grouped[date].length!==1?"s":""}</span>
      </h3>
      {grouped[date].map(b=><div key={b.id} className="card" style={{marginBottom:8,padding:"12px 14px",borderLeft:"4px solid "+statusColor[b.status]}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <p style={{fontWeight:700,fontSize:16}}>{b.customer_name}</p>
              <span style={{padding:"2px 8px",borderRadius:6,background:statusBg[b.status],color:statusColor[b.status],fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{b.status}</span>
            </div>
            <p style={{fontSize:13,color:"#8a8078",marginTop:3}}>
              {EM.cal} {b.reservation_time.slice(0,5)} - {b.party_size} guest{b.party_size!==1?"s":""}
              {b.table_id&&<span style={{color:"#bf4626",fontWeight:700,marginLeft:8}}>Table {b.table_id}</span>}
            </p>
            {b.customer_phone&&<p style={{fontSize:12,color:"#8a8078",marginTop:2}}>{EM.phone} {b.customer_phone}</p>}
            {b.customer_email&&<p style={{fontSize:11,color:"#8a8078",marginTop:1}}>{b.customer_email}</p>}
            {b.notes&&<p style={{fontSize:12,color:"#d4952a",marginTop:4,fontStyle:"italic"}}>Note: {b.notes}</p>}
          </div>
        </div>
        {b.status==="confirmed"&&b.reservation_date===today&&<div style={{display:"flex",gap:6,marginTop:8}}>
          <button className="btn btn-r" onClick={()=>checkIn(b)} style={{flex:2,padding:"8px",fontSize:12}}>{EM.check} Check In</button>
          <button className="btn btn-d" onClick={()=>noShow(b)} style={{flex:1,padding:"8px",fontSize:12}}>No-show</button>
          <button onClick={()=>cancel(b)} style={{flex:1,padding:"8px",fontSize:12,background:"none",color:"#8a8078",border:"1px solid #ede8de",borderRadius:8,cursor:"pointer",fontWeight:700}}>Cancel</button>
        </div>}
        {b.status==="confirmed"&&b.reservation_date>today&&<div style={{display:"flex",gap:6,marginTop:8}}>
          <button onClick={()=>cancel(b)} style={{padding:"8px 14px",fontSize:12,background:"none",color:"#dc2626",border:"1px solid #fee2e2",borderRadius:8,cursor:"pointer",fontWeight:700}}>Cancel Booking</button>
        </div>}
      </div>)}
    </div>)}
  </div>;
}


// -- INCOMING ONLINE ORDERS PANEL ------------------------------------------
// -- DRIVER VIEW: Active deliveries, code verification, cash collection ------
function DriverV({orders,setOrders,push,user,branch}){
  var [codeInput,setCodeInput]=useState({});
  var [collectInput,setCollectInput]=useState({});
  var driverName=user?.name||"Driver";

  // Active deliveries: ready or out for delivery, type=delivery
  var myDeliveries=orders.filter(o=>{
    if(branch&&o.branchId&&o.branchId!==branch.id)return false;
    if(o.type!=="delivery")return false;
    return o.status==="ready"||o.status==="out_for_delivery"||(o.status==="delivered"&&o.payMethod==="cod"&&!o.paid);
  });
  var todayDelivered=orders.filter(o=>{
    if(branch&&o.branchId&&o.branchId!==branch.id)return false;
    if(o.type!=="delivery"||o.status!=="delivered")return false;
    if(o.deliveredBy&&o.deliveredBy!==driverName)return false;
    return true;
  });
  var cashOwed=todayDelivered.filter(o=>o.payMethod==="cash"&&o.paid&&!o.cashHandoverId).reduce((s,o)=>s+(o.cashCollected||o.total||0),0);

  var verifyCode=(o)=>{
    var entered=codeInput[o.id]||"";
    if(!entered||entered.length<4){alert("Enter the 4-digit code from customer");return;}
    if(String(entered)!==String(o.deliveryCode)){
      push({title:"Wrong code",body:"Code does not match for "+o.id,color:"#dc2626"});
      return;
    }
    // Code matches - mark delivered
    setOrders(os=>os.map(x=>x.id===o.id?{...x,status:"delivered",deliveredAt:new Date().toISOString(),deliveredBy:driverName}:x));
    dbUpdateOrderStatus(o.id,"delivered").catch(e=>{});
    push({title:"Delivered!",body:o.id+" - confirmed by code",color:"#059669"});
    setCodeInput(c=>({...c,[o.id]:""}));
  };

  var pickup=(o)=>{
    setOrders(os=>os.map(x=>x.id===o.id?{...x,status:"out_for_delivery"}:x));
    dbUpdateOrderStatus(o.id,"out_for_delivery").catch(e=>{});
    push({title:"Out for delivery",body:o.id,color:"#2563eb"});
  };

  var collectCash=(o)=>{
    var amt=parseFloat(collectInput[o.id]||o.total||0);
    if(!amt||amt<=0){alert("Enter cash amount");return;}
    setOrders(os=>os.map(x=>x.id===o.id?{...x,paid:true,payMethod:"cash",cashCollected:amt,deliveredBy:driverName}:x));
    dbRecordCash(o.id,amt,driverName).catch(e=>console.log("Cash record save:",e));
    push({title:"Cash collected",body:fmt(amt)+" from "+o.id,color:"#059669"});
    setCollectInput(c=>({...c,[o.id]:""}));
  };

  return <div className="page">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div>
        <h2 style={{fontSize:22,marginBottom:2}}>Driver View</h2>
        <p style={{color:"#8a8078",fontSize:12}}>{driverName} - {branch?.name}</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{padding:"8px 12px",background:"#dbeafe",color:"#1e40af",borderRadius:9,fontSize:12,fontWeight:700}}>{myDeliveries.length} active</div>
        <div style={{padding:"8px 12px",background:cashOwed>0?"#fef3c7":"#d1fae5",color:cashOwed>0?"#92400e":"#065f46",borderRadius:9,fontSize:12,fontWeight:700}}>Cash owed: {fmt(cashOwed)}</div>
      </div>
    </div>

    {myDeliveries.length===0?<div className="card" style={{textAlign:"center",padding:30}}>
      <p style={{fontSize:40,marginBottom:10}}>{EM.bag}</p>
      <p style={{fontSize:14,color:"#8a8078"}}>No active deliveries</p>
    </div>:myDeliveries.map(o=>{
      var addrLine=o.address?(typeof o.address==="string"?o.address:[o.address.line1,o.address.postcode].filter(Boolean).join(", ")):"No address";
      var isCOD=o.payMethod==="cod"&&!o.paid;
      var needsCashStep=o.status==="delivered"&&isCOD;
      var fullyDone=o.status==="delivered"&&!isCOD;
      return <div key={o.id} className="card" style={{marginBottom:11,padding:14,borderLeft:"5px solid "+(fullyDone?"#10b981":needsCashStep?"#f59e0b":o.status==="out_for_delivery"?"#2563eb":"#bf4626")}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontWeight:700,fontSize:16,marginBottom:3}}>{o.customer||"Guest"}</p>
            <p style={{fontSize:11,color:"#8a8078"}}>{o.id} - {fmt(o.total)} - {o.payMethod==="cod"?"COD":o.paid?"PAID":"UNPAID"}</p>
            <p style={{fontSize:13,marginTop:6,fontWeight:600}}>{EM.pin} {addrLine}</p>
            {o.address?.notes&&<p style={{fontSize:11,color:"#8a8078",marginTop:2,fontStyle:"italic"}}>Note: {o.address.notes}</p>}
            {o.phone&&<p style={{fontSize:13,marginTop:4}}>{EM.phone} <a href={"tel:"+o.phone} style={{color:"#2563eb",fontWeight:700}}>{o.phone}</a></p>}
          </div>
          <span style={{padding:"3px 9px",background:fullyDone?"#d1fae5":needsCashStep?"#fef3c7":o.status==="out_for_delivery"?"#dbeafe":"#fee2e2",color:fullyDone?"#065f46":needsCashStep?"#92400e":o.status==="out_for_delivery"?"#1e40af":"#991b1b",borderRadius:5,fontSize:10,fontWeight:700}}>{fullyDone?"DONE":needsCashStep?"COLLECT CASH":o.status==="out_for_delivery"?"EN ROUTE":"READY TO PICKUP"}</span>
        </div>

        <div style={{background:"#fafaf5",borderRadius:6,padding:"7px 10px",marginBottom:10,fontSize:11}}>
          {(o.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between"}}><span>{it.name} x{it.qty}</span><span>{fmt((+it.price||0)*it.qty)}</span></div>)}
          <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #ede8de",marginTop:5,paddingTop:5,fontWeight:700}}><span>Total</span><span>{fmt(o.total)}</span></div>
        </div>

        {o.status==="ready"&&<button className="btn btn-r" onClick={()=>pickup(o)} style={{width:"100%",padding:"12px",fontSize:14}}>Pick Up Order - Set Out for Delivery</button>}

        {o.status==="out_for_delivery"&&<div style={{padding:"12px",background:"#fff7ed",borderRadius:9,border:"2px dashed #f59e0b"}}>
          <p style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:7,textAlign:"center"}}>At customer's door? Ask for delivery code</p>
          <div style={{display:"flex",gap:6}}>
            <input value={codeInput[o.id]||""} onChange={e=>setCodeInput(c=>({...c,[o.id]:e.target.value.replace(/[^0-9]/g,"").slice(0,4)}))} placeholder="0000" maxLength={4} style={{flex:1,padding:"14px",fontSize:24,fontWeight:700,textAlign:"center",letterSpacing:8,fontFamily:"'Courier New',monospace",border:"2px solid #f59e0b",borderRadius:8}}/>
            <button onClick={()=>verifyCode(o)} style={{padding:"14px 16px",background:"#059669",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>{EM.check} Verify</button>
          </div>
        </div>}

        {needsCashStep&&<div style={{padding:"12px",background:"#fef3c7",borderRadius:9,border:"2px solid #f59e0b",marginTop:8}}>
          <p style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:7,textAlign:"center"}}>{EM.pound} COLLECT {fmt(o.total)} CASH</p>
          <div style={{display:"flex",gap:6}}>
            <input type="number" step="0.01" value={collectInput[o.id]||o.total||""} onChange={e=>setCollectInput(c=>({...c,[o.id]:e.target.value}))} placeholder="0.00" style={{flex:1,padding:"11px",fontSize:16,fontWeight:700,textAlign:"center",border:"2px solid #f59e0b",borderRadius:8}}/>
            <button onClick={()=>collectCash(o)} style={{padding:"11px 14px",background:"#059669",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>{EM.check} Confirm Cash</button>
          </div>
        </div>}
      </div>;
    })}

    {todayDelivered.length>0&&<div className="card" style={{padding:14,marginTop:14,background:"#f0fdf4"}}>
      <p style={{fontWeight:700,fontSize:14,marginBottom:8,color:"#065f46"}}>{EM.check} Delivered Today: {todayDelivered.length}</p>
      <p style={{fontSize:11,color:"#065f46"}}>Cash collected (not yet handed over): {fmt(cashOwed)}</p>
      {cashOwed>0&&<p style={{fontSize:11,color:"#92400e",marginTop:6,fontWeight:700}}>{EM.star} Hand cash to manager - they will mark received in Admin tab</p>}
    </div>}
  </div>;
}

function IncomingOrdersV({orders,setOrders,push,branch,customers,tables,setTables,stations,menu}){
  var [filter,setFilter]=useState("new");
  var [soundOn,setSoundOn]=useState(()=>{
    try{return localStorage.getItem("latavola_sound")!=="0";}catch(e){return true;}
  });
  var seenOrderIdsRef=useRef(new Set());
  var initialLoadRef=useRef(true);
  var audioRef=useRef(null);
  var origTitleRef=useRef(typeof document!=="undefined"?document.title:"La Tavola");

  // Only show orders from online/QR sources that need attention
  var relevant=orders.filter(o=>{
    if(branch&&o.branchId&&o.branchId!==branch.id)return false;
    if(o.source==="staff"||o.source==="phone")return false;
    return true;
  });
  var newOrders=relevant.filter(o=>o.status==="pending");
  var accepted=relevant.filter(o=>["preparing","ready"].includes(o.status));
  var completed=relevant.filter(o=>["delivered","collected"].includes(o.status));
  var rejected=relevant.filter(o=>o.status==="cancelled");

  var list=filter==="new"?newOrders:filter==="accepted"?accepted:filter==="completed"?completed:rejected;

  // Play chime sound
  var playDing=useCallback(()=>{
    if(!soundOn)return;
    try{
      // Use Web Audio API to generate a "ding" chime (no file needed)
      var AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      var ctx=new AudioCtx();
      var osc=ctx.createOscillator();
      var gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";
      osc.frequency.setValueAtTime(880,ctx.currentTime); // High A note
      osc.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.15);
      gain.gain.setValueAtTime(0.35,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime+0.4);
      // Second note for "ding-dong" effect
      setTimeout(()=>{
        var osc2=ctx.createOscillator();
        var gain2=ctx.createGain();
        osc2.connect(gain2);gain2.connect(ctx.destination);
        osc2.type="sine";
        osc2.frequency.setValueAtTime(1100,ctx.currentTime);
        gain2.gain.setValueAtTime(0.3,ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime+0.5);
      },180);
    }catch(e){console.log("Sound failed:",e);}
  },[soundOn]);

  // Show browser notification
  var showBrowserNotif=useCallback((order)=>{
    if(typeof window==="undefined"||!("Notification" in window))return;
    if(Notification.permission!=="granted")return;
    try{
      var body=order.customer+" - "+fmt(order.total)+" - "+(order.type||"order");
      var notif=new Notification(String.fromCharCode(0xD83C,0xDF7D)+" New Order - La Tavola",{
        body:body,
        icon:"/icon-192.png",
        badge:"/icon-192.png",
        tag:"order-"+order.id,
        requireInteraction:false,
      });
      notif.onclick=function(){
        window.focus();
        this.close();
      };
      setTimeout(()=>notif.close(),8000);
    }catch(e){console.log("Notif failed:",e);}
  },[]);

  // Detect genuinely new orders (by ID, not just count) and trigger alerts
  useEffect(()=>{
    // On first load, mark all current new orders as "already seen" - don't alert
    if(initialLoadRef.current){
      newOrders.forEach(o=>seenOrderIdsRef.current.add(o.id));
      initialLoadRef.current=false;
      return;
    }
    // Check for any order IDs we haven't seen before
    var trulyNewOrders=newOrders.filter(o=>!seenOrderIdsRef.current.has(o.id));
    if(trulyNewOrders.length>0){
      var latest=trulyNewOrders[0];
      playDing();
      showBrowserNotif(latest);
      // Mark these orders as seen
      trulyNewOrders.forEach(o=>seenOrderIdsRef.current.add(o.id));
      // Flash tab title
      if(typeof document!=="undefined"){
        var titleFlash=setInterval(()=>{
          document.title=document.title===origTitleRef.current?
            String.fromCharCode(0xD83D,0xDD14)+" ("+newOrders.length+") New Orders - La Tavola":origTitleRef.current;
        },1000);
        setTimeout(()=>{
          clearInterval(titleFlash);
          document.title=origTitleRef.current;
        },10000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[newOrders.length,newOrders.map(o=>o.id).join(",")]);

  // Auto-refresh - reload orders from DB every 10 seconds
  useEffect(()=>{
    var interval=setInterval(()=>{
      fetchOrders().then(dbOrders=>{
        if(dbOrders&&dbOrders.length){
          var formatted=dbOrders.map(o=>({
            id:o.order_number,branchId:o.branch_id,userId:o.customer_id,
            customer:o.customer_name||"Guest",phone:o.customer_phone,
            items:o.items||[],subtotal:parseFloat(o.subtotal||0),
            deliveryFee:parseFloat(o.delivery_fee||0),total:parseFloat(o.total||0),
            status:o.status,type:o.type,paid:o.paid,payMethod:o.pay_method,
            address:o.address,slot:o.slot,takenBy:o.taken_by,source:o.source,
            tableId:o.table_id,stationProgress:o.station_progress||{},deliveryCode:o.delivery_code,codeMethod:o.code_method,deliveredAt:o.delivered_at,deliveredBy:o.delivered_by,cashCollected:o.cash_collected?parseFloat(o.cash_collected):null,cashHandoverId:o.cash_handover_id,serviceCharge:parseFloat(o.service_charge||0),discount:parseFloat(o.discount||0),
            created_at:o.created_at,
            time:new Date(o.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),
          }));
          setOrders(formatted);
        }
      }).catch(e=>console.log("Auto-refresh failed:",e));
    },10000); // 10 seconds
    return()=>clearInterval(interval);
  },[setOrders]);

  // Request notification permission on mount
  useEffect(()=>{
    if(typeof window!=="undefined"&&"Notification" in window){
      if(Notification.permission==="default"){
        Notification.requestPermission();
      }
    }
  },[]);

  var toggleSound=()=>{
    var newVal=!soundOn;
    setSoundOn(newVal);
    try{localStorage.setItem("latavola_sound",newVal?"1":"0");}catch(e){}
    if(newVal)playDing(); // Test sound when enabling
  };

  var getRiskInfo=(o)=>{
    var flags=[];
    var customer=customers?.find(c=>c.phone===o.phone);
    if(!customer||!customer.total_orders||customer.total_orders===0)flags.push("first_time");
    if(o.total>=50)flags.push("high_value");
    if(!o.paid)flags.push("unpaid");
    return flags;
  };

  var accept=o=>{
    setOrders(os=>os.map(x=>x.id===o.id?{...x,status:"preparing"}:x));
    push({title:"Order accepted",body:o.id+" - sent to kitchen",color:"#059669"});
    dbUpdateOrderStatus(o.id,"preparing").catch(e=>console.log("Status save failed:",e));
    // Auto-occupy table for QR/eat-in orders
    if(o.tableId&&tables&&setTables){
      var tbl=tables.find(t=>(t.id===o.tableId||t.id===+o.tableId||+t.id===+o.tableId)&&(!branch||!t.branchId||t.branchId===branch.id));
      if(tbl){
        setTables(ts=>ts.map(x=>x===tbl?{...x,status:"occupied",since:nowT(),guests:x.guests||1,orderId:o.id}:x));
        if(tbl.dbId){
          dbUpdateTableStatus(tbl.dbId,"occupied",{}).catch(e=>console.log("Table save failed:",e));
        }
      }
    }
    // Auto-print to stations that have it enabled
    if(stations&&menu){
      // Determine which stations have items in this order
      var stationsInOrder=new Set();
      (o.items||[]).forEach(it=>{
        var m=menu.find(x=>String(x.id)===String(it.id)||x.name===it.name);
        if(m&&m.station)stationsInOrder.add(m.station);
      });
      stations.forEach(s=>{
        if(s.autoPrint&&s.printerMethod&&s.printerMethod!=="none"&&stationsInOrder.has(s.name)){
          // Annotate items with their station for filtering inside ticket
          var enrichedOrder={...o,items:(o.items||[]).map(it=>{
            var m=menu.find(x=>String(x.id)===String(it.id)||x.name===it.name);
            return {...it,station:m?.station||null};
          })};
          setTimeout(()=>dispatchPrint(enrichedOrder,s,branch),300*Array.from(stationsInOrder).indexOf(s.name));
        }
      });
    }
  };
  var reject=o=>{
    var reason=prompt("Why are you rejecting this order? (optional)");
    setOrders(os=>os.map(x=>x.id===o.id?{...x,status:"cancelled",rejectReason:reason||"Restaurant unable to fulfill"}:x));
    push({title:"Order rejected",body:o.id,color:"#dc2626"});
    dbUpdateOrderStatus(o.id,"cancelled").catch(e=>console.log("Status save failed:",e));
  };
  var callCust=o=>{
    if(o.phone)window.location.href="tel:"+o.phone;
    else alert("No phone number on this order");
  };

  return <div className="page">
    <audio ref={audioRef} preload="auto"/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div>
        <h2 style={{fontSize:22,marginBottom:2}}>Incoming Orders</h2>
        <p style={{color:"#8a8078",fontSize:12}}>Online + QR code orders - {branch?.name} - auto-refreshes every 10 sec</p>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={toggleSound} title={soundOn?"Sound on - click to mute":"Sound off - click to enable"} style={{padding:"8px 12px",fontSize:18,background:soundOn?"#d1fae5":"#f5f5f5",color:soundOn?"#065f46":"#999",border:"2px solid "+(soundOn?"#059669":"#ddd"),borderRadius:8,cursor:"pointer",fontWeight:700}}>{soundOn?String.fromCharCode(0xD83D,0xDD0A):String.fromCharCode(0xD83D,0xDD07)}</button>
        {newOrders.length>0&&<div style={{padding:"8px 14px",background:"#dc2626",color:"#fff",borderRadius:20,fontSize:13,fontWeight:700,animation:"pulse 1s infinite",boxShadow:"0 0 20px rgba(220,38,38,.5)"}}>{newOrders.length} NEW!</div>}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      {[["New",newOrders.length,"#dc2626"],["Accepted",accepted.length,"#2563eb"],["Completed",completed.length,"#059669"],["Rejected",rejected.length,"#8a8078"]].map(([l,v,c])=><div key={l} style={{background:"#fff",borderRadius:11,padding:"10px 8px",border:(l==="New"&&v>0)?"2px solid "+c:"1px solid #ede8de",textAlign:"center",animation:(l==="New"&&v>0)?"flashPulse 1.5s infinite":"none"}}><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:"#8a8078",fontWeight:600}}>{l}</div></div>)}
    </div>

    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {[["new","New"],["accepted","Preparing"],["completed","Done"],["rejected","Rejected"]].map(([k,l])=><button key={k} onClick={()=>setFilter(k)} style={{padding:"8px 14px",fontSize:12,fontWeight:700,background:filter===k?"#bf4626":"#fff",color:filter===k?"#fff":"#1a1208",border:"2px solid "+(filter===k?"#bf4626":"#ede8de"),borderRadius:8,cursor:"pointer"}}>{l}</button>)}
    </div>

    {list.length===0?<div className="card" style={{textAlign:"center",padding:30}}>
      <p style={{fontSize:40,marginBottom:10}}>{EM.bag}</p>
      <p style={{fontSize:14,color:"#8a8078"}}>No {filter} orders</p>
    </div>:list.map(o=>{
      var risk=getRiskInfo(o);
      var isHighRisk=risk.length>=2;
      var isNew=o.status==="pending";
      var typeLabel=o.source==="qr-table"?"QR Eat-In Table "+(o.tableId||"?"):o.type==="delivery"?"Delivery":o.type==="collection"?"Collection "+(o.slot||""):o.type;
      return <div key={o.id} className="card" style={{
        marginBottom:10,
        padding:"12px 14px",
        borderLeft:"4px solid "+(isHighRisk?"#dc2626":o.status==="preparing"?"#2563eb":o.status==="cancelled"?"#8a8078":"#d4952a"),
        animation:isNew?"flashPulse 1.8s infinite":"none",
        boxShadow:isNew?"0 0 0 2px #dc2626":"0 1px 3px rgba(0,0,0,.05)",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
              {isNew&&<span style={{padding:"2px 8px",background:"#dc2626",color:"#fff",borderRadius:5,fontSize:10,fontWeight:700,animation:"pulse 1s infinite"}}>NEW</span>}
              <p style={{fontWeight:700,fontSize:15}}>{o.customer||"Guest"}</p>
              <span style={{padding:"2px 7px",background:"#f5f0ff",color:"#7c3aed",borderRadius:5,fontSize:10,fontWeight:700}}>{typeLabel}</span>
              {o.paid?<span style={{padding:"2px 7px",background:"#d1fae5",color:"#065f46",borderRadius:5,fontSize:10,fontWeight:700}}>PAID {o.payMethod||""}</span>:o.payMethod==="cod"?<span style={{padding:"2px 7px",background:"#fde68a",color:"#92400e",borderRadius:5,fontSize:10,fontWeight:700}}>{EM.pound} CASH ON DELIVERY</span>:o.payMethod==="cash-at-counter"?<span style={{padding:"2px 7px",background:"#fef3c7",color:"#92400e",borderRadius:5,fontSize:10,fontWeight:700}}>CASH AT COUNTER</span>:<span style={{padding:"2px 7px",background:"#fef3c7",color:"#92400e",borderRadius:5,fontSize:10,fontWeight:700}}>UNPAID</span>}
            </div>
            <p style={{fontSize:11,color:"#8a8078"}}>{o.id} - {o.time} - {fmt(o.total)}</p>
            {o.phone&&<p style={{fontSize:11,color:"#8a8078"}}>{EM.phone} {o.phone}</p>}
            {o.address&&<p style={{fontSize:11,color:"#8a8078"}}>{EM.pin} {typeof o.address==="string"?o.address:o.address.line1||""}</p>}
          </div>
        </div>

        {risk.length>0&&o.status==="pending"&&<div style={{padding:"7px 10px",background:isHighRisk?"#fee2e2":"#fffbeb",borderRadius:7,marginBottom:8,fontSize:11,color:isHighRisk?"#991b1b":"#92400e"}}>
          <strong>{isHighRisk?EM.cross+" High Risk":EM.star+" Check this"}:</strong>
          {risk.includes("first_time")&&" First-time customer."}
          {risk.includes("high_value")&&" High-value order ("+fmt(o.total)+")."}
          {risk.includes("unpaid")&&" Payment not collected yet."}
        </div>}

        <div style={{background:"#fafaf5",borderRadius:6,padding:"7px 10px",marginBottom:8,fontSize:11}}>
          {(o.items||[]).map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between"}}><span>{it.name} x{it.qty}</span><span>{fmt((+it.price||0)*it.qty)}</span></div>)}
        </div>

        {o.status==="pending"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="btn btn-r" onClick={()=>accept(o)} style={{flex:2,padding:"10px",fontSize:13,minWidth:160}}>{EM.check} Accept & Send to Kitchen</button>
          {o.phone&&<button onClick={()=>callCust(o)} style={{flex:1,padding:"10px",fontSize:12,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,minWidth:80}}>{EM.phone} Call</button>}
          <button onClick={()=>reject(o)} style={{flex:1,padding:"10px",fontSize:12,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,minWidth:80}}>Reject</button>
          {stations&&stations.some(s=>s.printerMethod&&s.printerMethod!=="none")&&<button onClick={()=>{
            var enriched={...o,items:(o.items||[]).map(it=>{var m=menu?.find(x=>String(x.id)===String(it.id)||x.name===it.name);return{...it,station:m?.station||null};})};
            stations.filter(s=>s.printerMethod&&s.printerMethod!=="none").forEach((s,i)=>setTimeout(()=>dispatchPrint(enriched,s,branch),i*400));
          }} title="Manually print to all stations" style={{padding:"10px 12px",fontSize:11,background:"#1a1208",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>{EM.cart} Print</button>}
        </div>}
        {o.status==="preparing"&&<div style={{display:"flex",gap:6}}>
          <button className="btn btn-p" onClick={()=>{
            setOrders(os=>os.map(x=>x.id===o.id?{...x,status:"ready"}:x));
            dbUpdateOrderStatus(o.id,"ready").catch(e=>console.log("Status save failed:",e));
          }} style={{flex:1,padding:"9px",fontSize:12}}>Mark Ready</button>
          <button className="btn btn-d" onClick={()=>{
            var isCOD=o.payMethod==="cod"&&!o.paid;
            var newStatus=o.type==="delivery"?"delivered":"collected";
            if(isCOD){
              if(!window.confirm("COD order - did driver collect "+fmt(o.total)+" cash?\n\nOK = Yes, cash collected\nCancel = No, not paid"))return;
              setOrders(os=>os.map(x=>x.id===o.id?{...x,status:newStatus,paid:true,payMethod:"cash"}:x));
              push({title:"Cash collected",body:o.id+" - "+fmt(o.total),color:"#059669"});
              dbUpdateOrderPayment(o.id,true,"cash").catch(e=>console.log("Save failed:",e));
              dbUpdateOrderStatus(o.id,newStatus).catch(e=>console.log("Status save failed:",e));
            }else{
              setOrders(os=>os.map(x=>x.id===o.id?{...x,status:newStatus}:x));
              dbUpdateOrderStatus(o.id,newStatus).catch(e=>console.log("Status save failed:",e));
            }
          }} style={{flex:1,padding:"9px",fontSize:12}}>Complete</button>
        </div>}
      </div>;
    })}
  </div>;
}

// POS UI router - dispatches to correct UI based on user preference
// ============================================================
// CASH DRAWER ALERT - shows when drawer should open
// ============================================================
function DrawerOpenAlert({onClose,cashGiven,changeReturn,total}){
  // Play beep sound on mount
  useEffect(()=>{
    try{
      var AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      var ctx=new AudioCtx();
      [0,0.15,0.3].forEach(delay=>{
        var osc=ctx.createOscillator();
        var gain=ctx.createGain();
        osc.connect(gain);gain.connect(ctx.destination);
        osc.frequency.value=880;
        osc.type="sine";
        gain.gain.setValueAtTime(0,ctx.currentTime+delay);
        gain.gain.linearRampToValueAtTime(0.3,ctx.currentTime+delay+0.02);
        gain.gain.linearRampToValueAtTime(0,ctx.currentTime+delay+0.12);
        osc.start(ctx.currentTime+delay);
        osc.stop(ctx.currentTime+delay+0.13);
      });
    }catch(e){}
  },[]);

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
    <div style={{background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",borderRadius:18,padding:"36px 30px",maxWidth:500,width:"100%",textAlign:"center",boxShadow:"0 30px 80px rgba(5,150,105,.5)",border:"5px solid #fff",animation:"shake .5s"}}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}@keyframes pulseBig{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
      <p style={{fontSize:64,marginBottom:5,animation:"pulseBig 1s ease-in-out infinite"}}>{String.fromCharCode(0xD83D,0xDCB5)}</p>
      <h2 style={{fontSize:32,fontWeight:700,marginBottom:14,letterSpacing:2}}>OPEN DRAWER NOW</h2>
      
      <div style={{background:"rgba(0,0,0,.2)",borderRadius:12,padding:"18px",marginBottom:16}}>
        <p style={{fontSize:13,opacity:.85,fontWeight:700,letterSpacing:2,marginBottom:6}}>CUSTOMER GAVE</p>
        <p style={{fontSize:38,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{fmt(cashGiven)}</p>
      </div>
      
      {changeReturn>0&&<div style={{background:"#fff",color:"#1a1208",borderRadius:12,padding:"22px 18px",marginBottom:16,border:"3px solid #d4952a"}}>
        <p style={{fontSize:13,color:"#bf4626",fontWeight:700,letterSpacing:2,marginBottom:6}}>RETURN CHANGE</p>
        <p style={{fontSize:54,fontWeight:700,color:"#bf4626",fontFamily:"'Courier New',monospace",lineHeight:1}}>{fmt(changeReturn)}</p>
      </div>}
      
      {changeReturn===0&&<div style={{padding:"14px",background:"rgba(255,255,255,.2)",borderRadius:9,marginBottom:16}}>
        <p style={{fontSize:18,fontWeight:700}}>Exact amount - No change</p>
      </div>}
      
      <p style={{fontSize:13,opacity:.85,marginBottom:16}}>Place {fmt(total)} in drawer{changeReturn>0?", give "+fmt(changeReturn)+" change":""}</p>
      
      <button onClick={onClose} style={{padding:"18px 36px",background:"#fff",color:"#059669",border:"none",borderRadius:12,fontSize:18,fontWeight:700,cursor:"pointer",width:"100%",boxShadow:"0 6px 18px rgba(0,0,0,.25)",letterSpacing:1}}>{EM.check} DONE - Close Drawer</button>
    </div>
  </div>;
}

// ============================================================
// PAYMENT FLOW - reusable for all 3 POS UIs (cash/card/split)
// ============================================================
function PaymentFlow({total,onComplete,onCancel,branch,user,orderId}){
  var [step,setStep]=useState("choose"); // choose, cash, card, split, drawer
  var [cashGiven,setCashGiven]=useState("");
  var [tipAmount,setTipAmount]=useState(0);
  var [splitCash,setSplitCash]=useState("");
  var [splitCard,setSplitCard]=useState("");
  var [splitCashGiven,setSplitCashGiven]=useState("");
  var [showDrawer,setShowDrawer]=useState(null); // { cashGiven, changeReturn, total }

  var changeReturn=Math.max(0,parseFloat(cashGiven||0)-(total+tipAmount));
  var totalWithTip=total+tipAmount;
  var splitTotal=parseFloat(splitCash||0)+parseFloat(splitCard||0);
  var splitChange=Math.max(0,parseFloat(splitCashGiven||0)-parseFloat(splitCash||0));

  // CASH FLOW
  var confirmCash=()=>{
    if(parseFloat(cashGiven||0)<totalWithTip){alert("Insufficient cash given");return;}
    var paymentData={
      method:"cash",
      total:totalWithTip,
      tip:tipAmount,
      cashGiven:parseFloat(cashGiven),
      changeReturn:changeReturn,
      payments:[{method:"cash",amount:totalWithTip,cashGiven:parseFloat(cashGiven),changeReturned:changeReturn}],
    };
    // Save to DB
    if(orderId){
      dbRecordPayment({order_id:orderId,branch_id:branch?.id,payment_method:"cash",amount:totalWithTip,cash_given:parseFloat(cashGiven),change_returned:changeReturn,tip_amount:tipAmount,taken_by:user?.name}).catch(e=>console.log("Payment save fail:",e));
      dbRecordDrawer({branch_id:branch?.id,event_type:"opened-payment",staff_name:user?.name,order_id:orderId,amount:totalWithTip}).catch(e=>{});
    }
    // Show drawer alert, then complete
    setShowDrawer({cashGiven:parseFloat(cashGiven),changeReturn,total:totalWithTip});
    setTimeout(()=>{
      onComplete(paymentData);
    },100);
  };

  // CARD FLOW (simulated - in real life would integrate with terminal)
  var confirmCard=()=>{
    var paymentData={
      method:"card",
      total:totalWithTip,
      tip:tipAmount,
      payments:[{method:"card",amount:totalWithTip}],
    };
    if(orderId){
      dbRecordPayment({order_id:orderId,branch_id:branch?.id,payment_method:"card",amount:totalWithTip,tip_amount:tipAmount,taken_by:user?.name}).catch(e=>{});
    }
    onComplete(paymentData);
  };

  // SPLIT FLOW
  var confirmSplit=()=>{
    if(Math.abs(splitTotal-totalWithTip)>0.01){alert("Split amounts don't add up to total: "+fmt(totalWithTip));return;}
    if(parseFloat(splitCashGiven||0)<parseFloat(splitCash||0)){alert("Cash given less than cash portion");return;}
    var paymentData={
      method:"split",
      total:totalWithTip,
      tip:tipAmount,
      cashPart:parseFloat(splitCash),
      cardPart:parseFloat(splitCard),
      cashGiven:parseFloat(splitCashGiven||0),
      changeReturn:splitChange,
      payments:[
        {method:"cash",amount:parseFloat(splitCash),cashGiven:parseFloat(splitCashGiven||0),changeReturned:splitChange},
        {method:"card",amount:parseFloat(splitCard)},
      ],
    };
    if(orderId){
      dbRecordPayment({order_id:orderId,branch_id:branch?.id,payment_method:"split-cash",amount:parseFloat(splitCash),cash_given:parseFloat(splitCashGiven||0),change_returned:splitChange,taken_by:user?.name}).catch(e=>{});
      dbRecordPayment({order_id:orderId,branch_id:branch?.id,payment_method:"split-card",amount:parseFloat(splitCard),tip_amount:tipAmount,taken_by:user?.name}).catch(e=>{});
      dbRecordDrawer({branch_id:branch?.id,event_type:"opened-payment",staff_name:user?.name,order_id:orderId,amount:parseFloat(splitCash)}).catch(e=>{});
    }
    setShowDrawer({cashGiven:parseFloat(splitCashGiven||0),changeReturn:splitChange,total:parseFloat(splitCash)});
    setTimeout(()=>onComplete(paymentData),100);
  };

  // QUICK AMOUNT BUTTONS
  var quickAmounts=[5,10,20,50,100];
  // Round up suggestions: total 17.44 -> suggest 20
  var roundUp=Math.ceil(totalWithTip/5)*5;
  if(!quickAmounts.includes(roundUp))quickAmounts.push(roundUp);
  quickAmounts.sort((a,b)=>a-b);

  if(showDrawer){
    return <DrawerOpenAlert {...showDrawer} onClose={()=>{setShowDrawer(null);}}/>;
  }

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
    <div style={{background:"#fafaf5",color:"#1a1208",borderRadius:14,maxWidth:540,width:"100%",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
      
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:2}}>PAYMENT</p>
          <h2 style={{fontSize:18,fontWeight:700}}>{
            step==="choose"?"How is customer paying?":
            step==="cash"?"Cash Payment":
            step==="card"?"Card Payment":
            step==="split"?"Split Payment":""
          }</h2>
        </div>
        <button onClick={onCancel} style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.15)",color:"#fff",border:"none",cursor:"pointer",fontSize:18,fontWeight:700}}>x</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:18}}>
        
        {/* Total display */}
        <div style={{textAlign:"center",marginBottom:18,padding:"18px",background:"#fff",borderRadius:12,border:"3px solid #d4952a"}}>
          <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:2,marginBottom:5}}>TOTAL DUE</p>
          <p style={{fontSize:46,fontWeight:700,color:"#bf4626",fontFamily:"'Courier New',monospace",lineHeight:1}}>{fmt(totalWithTip)}</p>
          {tipAmount>0&&<p style={{fontSize:11,color:"#7c3aed",marginTop:5}}>Includes {fmt(tipAmount)} tip</p>}
        </div>

        {/* STEP: CHOOSE PAYMENT METHOD */}
        {step==="choose"&&<>
          {/* Tip selector */}
          <div style={{marginBottom:14}}>
            <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:5}}>OPTIONAL TIP</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {[0,1,2,5,10].map(t=><button key={t} onClick={()=>setTipAmount(t)} style={{padding:"10px 4px",border:"2px solid "+(tipAmount===t?"#7c3aed":"#ede8de"),borderRadius:7,background:tipAmount===t?"#f5f3ff":"#fff",fontWeight:700,fontSize:13,cursor:"pointer",color:tipAmount===t?"#7c3aed":"#1a1208"}}>{t===0?"No tip":fmt(t)}</button>)}
            </div>
          </div>

          {/* Payment method buttons - HUGE */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <button onClick={()=>setStep("cash")} style={{padding:"30px 14px",background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(5,150,105,.3)",fontWeight:700}}>
              <p style={{fontSize:48,marginBottom:8,lineHeight:1}}>{String.fromCharCode(0xD83D,0xDCB5)}</p>
              <p style={{fontSize:16,letterSpacing:1}}>CASH</p>
            </button>
            <button onClick={()=>setStep("card")} style={{padding:"30px 14px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(37,99,235,.3)",fontWeight:700}}>
              <p style={{fontSize:48,marginBottom:8,lineHeight:1}}>{String.fromCharCode(0xD83D,0xDCB3)}</p>
              <p style={{fontSize:16,letterSpacing:1}}>CARD</p>
            </button>
            <button onClick={()=>{var half=(totalWithTip/2).toFixed(2);setSplitCash(half);setSplitCard(half);setStep("split");}} style={{padding:"30px 14px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(124,58,237,.3)",fontWeight:700}}>
              <p style={{fontSize:32,marginBottom:8,lineHeight:1}}>{String.fromCharCode(0xD83D,0xDCB5)}+{String.fromCharCode(0xD83D,0xDCB3)}</p>
              <p style={{fontSize:14,letterSpacing:1}}>SPLIT</p>
            </button>
          </div>
        </>}

        {/* STEP: CASH */}
        {step==="cash"&&<>
          <p style={{fontSize:12,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:5}}>AMOUNT GIVEN BY CUSTOMER</p>
          <input type="number" step="0.01" value={cashGiven} onChange={e=>setCashGiven(e.target.value)} placeholder="0.00" autoFocus style={{width:"100%",padding:"16px 18px",border:"3px solid #d4952a",borderRadius:11,fontSize:32,fontWeight:700,textAlign:"right",fontFamily:"'Courier New',monospace",marginBottom:8,boxSizing:"border-box"}}/>
          
          <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:5}}>QUICK AMOUNTS</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:11}}>
            {quickAmounts.map(v=><button key={v} onClick={()=>setCashGiven(v.toFixed(2))} style={{padding:"12px 5px",background:"#fff",border:"2px solid #ede8de",borderRadius:8,fontWeight:700,fontSize:14,cursor:"pointer"}}>{fmt(v)}</button>)}
            <button onClick={()=>setCashGiven(totalWithTip.toFixed(2))} style={{padding:"12px 5px",background:"#d4952a",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:14,cursor:"pointer",gridColumn:"span 3"}}>Exact: {fmt(totalWithTip)}</button>
          </div>

          {parseFloat(cashGiven||0)>0&&<div style={{padding:"18px",background:parseFloat(cashGiven)>=totalWithTip?"#d1fae5":"#fee2e2",borderRadius:11,border:"3px solid "+(parseFloat(cashGiven)>=totalWithTip?"#059669":"#dc2626"),marginBottom:11,textAlign:"center"}}>
            {parseFloat(cashGiven)>=totalWithTip?<>
              <p style={{fontSize:11,color:"#065f46",fontWeight:700,letterSpacing:2,marginBottom:5}}>CHANGE TO RETURN</p>
              <p style={{fontSize:46,fontWeight:700,color:"#059669",fontFamily:"'Courier New',monospace",lineHeight:1}}>{fmt(changeReturn)}</p>
            </>:<>
              <p style={{fontSize:11,color:"#991b1b",fontWeight:700,letterSpacing:2,marginBottom:5}}>INSUFFICIENT</p>
              <p style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>Need {fmt(totalWithTip-parseFloat(cashGiven))} more</p>
            </>}
          </div>}

          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setStep("choose")} style={{flex:1,padding:"14px",background:"#fff",border:"2px solid #ede8de",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>{"< Back"}</button>
            <button disabled={!cashGiven||parseFloat(cashGiven)<totalWithTip} onClick={confirmCash} style={{flex:2,padding:"14px",background:!cashGiven||parseFloat(cashGiven)<totalWithTip?"#9ca3af":"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:!cashGiven||parseFloat(cashGiven)<totalWithTip?"not-allowed":"pointer"}}>{EM.check} Confirm & Open Drawer</button>
          </div>
        </>}

        {/* STEP: CARD */}
        {step==="card"&&<>
          <div style={{padding:30,background:"#fff",borderRadius:11,marginBottom:14,textAlign:"center",border:"2px dashed #2563eb"}}>
            <p style={{fontSize:48,marginBottom:9}}>{String.fromCharCode(0xD83D,0xDCB3)}</p>
            <p style={{fontSize:14,color:"#1a1208",fontWeight:700,marginBottom:5}}>Insert / Tap card on terminal</p>
            <p style={{fontSize:12,color:"#8a8078"}}>Customer should follow prompts on card terminal</p>
          </div>

          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setStep("choose")} style={{flex:1,padding:"14px",background:"#fff",border:"2px solid #ede8de",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>{"< Back"}</button>
            <button onClick={confirmCard} style={{flex:2,padding:"14px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>{EM.check} Card Approved</button>
          </div>
        </>}

        {/* STEP: SPLIT */}
        {step==="split"&&<>
          <p style={{fontSize:12,color:"#8a8078",marginBottom:11,fontStyle:"italic"}}>Split between cash and card. Total must equal {fmt(totalWithTip)}.</p>
          
          <div style={{padding:"12px",background:"#d1fae5",borderRadius:9,marginBottom:9,borderLeft:"3px solid #059669"}}>
            <p style={{fontSize:11,color:"#065f46",fontWeight:700,letterSpacing:1,marginBottom:5}}>{String.fromCharCode(0xD83D,0xDCB5)} CASH PORTION</p>
            <input type="number" step="0.01" value={splitCash} onChange={e=>setSplitCash(e.target.value)} placeholder="0.00" style={{width:"100%",padding:"11px",border:"2px solid #059669",borderRadius:7,fontSize:18,fontWeight:700,textAlign:"right",fontFamily:"'Courier New',monospace",marginBottom:6,boxSizing:"border-box"}}/>
            <p style={{fontSize:10,color:"#065f46",marginBottom:3}}>Cash given:</p>
            <input type="number" step="0.01" value={splitCashGiven} onChange={e=>setSplitCashGiven(e.target.value)} placeholder="0.00" style={{width:"100%",padding:"9px",border:"1px solid #059669",borderRadius:6,fontSize:14,fontWeight:700,textAlign:"right",fontFamily:"'Courier New',monospace",boxSizing:"border-box"}}/>
            {splitChange>0&&<p style={{fontSize:11,color:"#059669",fontWeight:700,marginTop:4}}>Change: {fmt(splitChange)}</p>}
          </div>

          <div style={{padding:"12px",background:"#dbeafe",borderRadius:9,marginBottom:11,borderLeft:"3px solid #2563eb"}}>
            <p style={{fontSize:11,color:"#1e3a8a",fontWeight:700,letterSpacing:1,marginBottom:5}}>{String.fromCharCode(0xD83D,0xDCB3)} CARD PORTION</p>
            <input type="number" step="0.01" value={splitCard} onChange={e=>setSplitCard(e.target.value)} placeholder="0.00" style={{width:"100%",padding:"11px",border:"2px solid #2563eb",borderRadius:7,fontSize:18,fontWeight:700,textAlign:"right",fontFamily:"'Courier New',monospace",boxSizing:"border-box"}}/>
          </div>

          <div style={{padding:"11px",background:Math.abs(splitTotal-totalWithTip)<0.01?"#d1fae5":"#fee2e2",borderRadius:9,marginBottom:11,textAlign:"center",border:"2px solid "+(Math.abs(splitTotal-totalWithTip)<0.01?"#059669":"#dc2626")}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:1,color:Math.abs(splitTotal-totalWithTip)<0.01?"#065f46":"#991b1b"}}>SPLIT TOTAL: {fmt(splitTotal)} of {fmt(totalWithTip)}</p>
            {Math.abs(splitTotal-totalWithTip)>=0.01&&<p style={{fontSize:11,color:"#dc2626",marginTop:3,fontWeight:700}}>Difference: {fmt(splitTotal-totalWithTip)}</p>}
          </div>

          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setStep("choose")} style={{flex:1,padding:"14px",background:"#fff",border:"2px solid #ede8de",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>{"< Back"}</button>
            <button onClick={confirmSplit} disabled={Math.abs(splitTotal-totalWithTip)>=0.01} style={{flex:2,padding:"14px",background:Math.abs(splitTotal-totalWithTip)>=0.01?"#9ca3af":"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:Math.abs(splitTotal-totalWithTip)>=0.01?"not-allowed":"pointer"}}>{EM.check} Confirm Split Payment</button>
          </div>
        </>}
      </div>
    </div>
  </div>;
}

// PHONE ORDER CUSTOMER POPUP - opens from POS to capture customer for delivery/collection
// SLIDE-UP KEYBOARD - reusable touch keyboard that appears from bottom
function SlideUpKeyboard({mode,value,onChange,onSubmit,onClose,sizePreset}){
  // mode: "numeric" (phone), "alpha" (text), "alphanumeric" (postcode/email)
  // sizePreset: "small" | "medium" | "large"
  var [shifted,setShifted]=useState(true); // capital letters by default for postcode
  
  // Size presets - tuned for visibility (keyboard + popup must both fit)
  var sizes={
    small:{btnH:46,btnFs:16,gap:4,padding:8,labelFs:11,displayFs:22},
    medium:{btnH:58,btnFs:20,gap:5,padding:10,labelFs:12,displayFs:26},
    large:{btnH:72,btnFs:24,gap:6,padding:12,labelFs:13,displayFs:30},
  };
  var sz=sizes[sizePreset||"medium"];

  var typeChar=k=>{
    if(k==="DEL")onChange(value.slice(0,-1));
    else if(k==="SPACE")onChange(value+" ");
    else if(k==="SHIFT")setShifted(!shifted);
    else if(k==="OK"){if(onSubmit)onSubmit();}
    else if(k==="CLOSE"){if(onClose)onClose();}
    else{
      var char=mode==="alpha"||mode==="alphanumeric"?(shifted?k.toUpperCase():k.toLowerCase()):k;
      onChange(value+char);
    }
  };

  // Button style - warm restaurant brand
  var btnStyle=(special)=>{
    var baseBg=special==="action"?"linear-gradient(180deg,#bf4626,#a3391d)":
               special==="del"?"linear-gradient(180deg,#dc2626,#991b1b)":
               special==="ok"?"linear-gradient(180deg,#059669,#047857)":
               special==="space"?"linear-gradient(180deg,#fff,#fafaf5)":
               "linear-gradient(180deg,#fff,#f5f0e8)";
    var color=special==="action"||special==="del"||special==="ok"?"#fff":"#1a1208";
    return {
      height:sz.btnH,
      background:baseBg,
      color:color,
      border:"1px solid "+(special==="action"||special==="del"||special==="ok"?"transparent":"#d4b896"),
      borderRadius:10,
      fontSize:sz.btnFs,
      fontWeight:700,
      cursor:"pointer",
      boxShadow:"0 2px 0 rgba(0,0,0,.15), 0 4px 8px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5)",
      transition:"transform .08s, box-shadow .08s",
      userSelect:"none",
      WebkitUserSelect:"none",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      letterSpacing:.5,
    };
  };

  var pressDown=e=>{e.currentTarget.style.transform="translateY(2px)";e.currentTarget.style.boxShadow="0 0 0 rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5)";};
  var pressUp=e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 0 rgba(0,0,0,.15), 0 4px 8px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5)";};

  // Define keys based on mode
  var renderKeys=()=>{
    if(mode==="numeric"){
      return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:sz.gap}}>
        {["1","2","3","4","5","6","7","8","9"].map(k=><button key={k} onClick={()=>typeChar(k)} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{k}</button>)}
        <button onClick={()=>typeChar("DEL")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("del")}>{String.fromCharCode(0x232B)}</button>
        <button onClick={()=>typeChar("0")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>0</button>
        <button onClick={()=>typeChar("OK")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("ok")}>{String.fromCharCode(0x2713)}</button>
      </div>;
    }
    // alpha or alphanumeric
    var row1=mode==="alphanumeric"?["1","2","3","4","5","6","7","8","9","0"]:["q","w","e","r","t","y","u","i","o","p"];
    var row2=mode==="alphanumeric"?["q","w","e","r","t","y","u","i","o","p"]:["a","s","d","f","g","h","j","k","l"];
    var row3=mode==="alphanumeric"?["a","s","d","f","g","h","j","k","l"]:["z","x","c","v","b","n","m"];
    var row4=mode==="alphanumeric"?["z","x","c","v","b","n","m"]:[];

    return <div style={{display:"flex",flexDirection:"column",gap:sz.gap}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat("+row1.length+",1fr)",gap:sz.gap}}>
        {row1.map(k=><button key={k} onClick={()=>typeChar(k)} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{shifted?k.toUpperCase():k}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat("+row2.length+",1fr)",gap:sz.gap,padding:"0 "+(mode==="alpha"?sz.btnH/2:0)+"px"}}>
        {row2.map(k=><button key={k} onClick={()=>typeChar(k)} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{shifted?k.toUpperCase():k}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mode==="alpha"?"1.5fr repeat("+row3.length+",1fr) 1.5fr":"repeat("+(row3.length+1)+",1fr) 1.5fr",gap:sz.gap}}>
        {mode==="alpha"&&<button onClick={()=>typeChar("SHIFT")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle(shifted?"action":"")}>{shifted?String.fromCharCode(0x21EA):String.fromCharCode(0x21E7)}</button>}
        {row3.map(k=><button key={k} onClick={()=>typeChar(k)} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{shifted?k.toUpperCase():k}</button>)}
        {mode==="alphanumeric"&&row4.length===0&&<button onClick={()=>typeChar("SHIFT")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle(shifted?"action":"")}>{shifted?String.fromCharCode(0x21EA):String.fromCharCode(0x21E7)}</button>}
        <button onClick={()=>typeChar("DEL")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("del")}>{String.fromCharCode(0x232B)}</button>
      </div>
      {row4.length>0&&<div style={{display:"grid",gridTemplateColumns:"1.5fr repeat("+row4.length+",1fr) 1.5fr",gap:sz.gap}}>
        <button onClick={()=>typeChar("SHIFT")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle(shifted?"action":"")}>{shifted?String.fromCharCode(0x21EA):String.fromCharCode(0x21E7)}</button>
        {row4.map(k=><button key={k} onClick={()=>typeChar(k)} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{shifted?k.toUpperCase():k}</button>)}
        <button onClick={()=>typeChar("DEL")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("del")}>{String.fromCharCode(0x232B)}</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 4fr 1fr",gap:sz.gap}}>
        <button onClick={()=>typeChar("CLOSE")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle()}>{String.fromCharCode(0x2715)}</button>
        <button onClick={()=>typeChar("SPACE")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("space")}>SPACE</button>
        <button onClick={()=>typeChar("OK")} onMouseDown={pressDown} onMouseUp={pressUp} onMouseLeave={pressUp} onTouchStart={pressDown} onTouchEnd={pressUp} style={btnStyle("ok")}>{String.fromCharCode(0x2713)}</button>
      </div>
    </div>;
  };

  return <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(180deg,#fafaf5,#f0e8d8)",borderTop:"3px solid #d4b896",boxShadow:"0 -8px 30px rgba(0,0,0,.2)",padding:sz.padding,zIndex:9999,animation:"slideUpKb .3s ease-out"}}>
    <style>{`@keyframes slideUpKb{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    {renderKeys()}
  </div>;
}

function PhoneCustomerPopup({onClose,onCustomerReady,customers,setCustomers,push,branch,initialPhone}){
  var [step,setStep]=useState(initialPhone?"search":"phone"); // phone, search, existing, postcode, address, manual
  var [phone,setPhone]=useState(initialPhone||"");
  var [found,setFound]=useState(null);
  var [orderType,setOrderType]=useState("delivery");
  var [postcode,setPostcode]=useState("");
  var [postcodeOptions,setPostcodeOptions]=useState([]);
  var [lookingUp,setLookingUp]=useState(false);
  var [postcodeError,setPostcodeError]=useState("");
  var [selectedPostcode,setSelectedPostcode]=useState(null);
  var [doorNum,setDoorNum]=useState("");
  var [streetName,setStreetName]=useState("");
  var [name,setName]=useState("");
  var [notes,setNotes]=useState("");
  var [activeField,setActiveField]=useState(null); // 'phone','postcode','name','door','street','notes' or null
  var keyboardSize=(()=>{try{return localStorage.getItem("kb_size")||"medium";}catch(e){return "medium";}})();

  // On mount, if initialPhone provided, search immediately
  useEffect(()=>{
    if(initialPhone){
      var clean=initialPhone.replace(/\s+/g,"").replace(/^0/,"").replace(/^\+?44/,"0");
      var full=clean.startsWith("0")?clean:"0"+clean;
      var c=customers.find(x=>x.phone&&x.phone.replace(/\s+/g,"")===full);
      if(c){setFound(c);setName(c.name);setStep("existing");}
      else{setStep("postcode");}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Auto-show keyboard for phone and postcode steps (always required)
  useEffect(()=>{
    if(step==="phone")setActiveField("phone");
    else if(step==="postcode")setActiveField("postcode");
    else setActiveField(null);
  },[step]);

  // Search by phone
  var searchPhone=()=>{
    var clean=phone.replace(/\s+/g,"").replace(/^0/,"").replace(/^\+?44/,"0");
    var full=clean.startsWith("0")?clean:"0"+clean;
    if(full.length<10){push({title:"Invalid phone",body:"Enter a valid UK phone number",color:"#dc2626"});return;}
    var c=customers.find(x=>x.phone&&x.phone.replace(/\s+/g,"")===full);
    if(c){setFound(c);setName(c.name);setStep("existing");}
    else{setStep("postcode");}
  };

  // Postcode lookup using postcodes.io (free)
  var lookupPostcodeIO=()=>{
    if(!postcode.trim()){push({title:"Enter postcode",body:"Type a postcode first",color:"#dc2626"});return;}
    setLookingUp(true);setPostcodeError("");setPostcodeOptions([]);
    var clean=postcode.trim().toUpperCase().replace(/\s+/g,"");
    // First try autocomplete (returns multiple matches)
    fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(clean)+"/autocomplete")
      .then(r=>r.json())
      .then(data=>{
        if(data.result&&data.result.length>0){
          // Get details for each suggestion (lat/lng to validate)
          var promises=data.result.slice(0,8).map(pc=>fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(pc)).then(r=>r.json()).catch(()=>null));
          Promise.all(promises).then(results=>{
            var valid=results.filter(r=>r&&r.result).map(r=>({
              postcode:r.result.postcode,
              lat:r.result.latitude,
              lng:r.result.longitude,
              area:r.result.admin_district||r.result.region||"",
              parish:r.result.parish||"",
            }));
            setPostcodeOptions(valid);
            setLookingUp(false);
            if(valid.length===0)setPostcodeError("No matches found. Try typing more or enter manually.");
          });
        }else{
          // Try direct lookup (full postcode)
          fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(clean))
            .then(r=>r.json())
            .then(data2=>{
              if(data2.result){
                setPostcodeOptions([{
                  postcode:data2.result.postcode,
                  lat:data2.result.latitude,
                  lng:data2.result.longitude,
                  area:data2.result.admin_district||"",
                  parish:data2.result.parish||"",
                }]);
              }else{
                setPostcodeError("Not a valid UK postcode. Type more or enter manually.");
              }
              setLookingUp(false);
            }).catch(()=>{setPostcodeError("Lookup failed - check internet");setLookingUp(false);});
        }
      })
      .catch(()=>{setPostcodeError("Lookup failed - check internet");setLookingUp(false);});
  };

  // Calculate distance from branch to selected postcode
  var calculateDistance=(lat,lng)=>{
    if(!branch||!branch.lat||!branch.lng)return 0;
    var R=3958.8; // miles
    var dLat=(lat-branch.lat)*Math.PI/180;
    var dLng=(lng-branch.lng)*Math.PI/180;
    var a=Math.sin(dLat/2)**2+Math.cos(branch.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
    var c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R*c;
  };

  // Confirm address & save customer
  var confirmAddress=()=>{
    if(!name.trim()){push({title:"Name required",body:"Enter customer name",color:"#dc2626"});return;}
    if(orderType==="delivery"){
      if(!doorNum.trim()){push({title:"Door number required",body:"Enter door/flat number",color:"#dc2626"});return;}
      if(!streetName.trim()){push({title:"Street required",body:"Enter street/road name",color:"#dc2626"});return;}
      if(!selectedPostcode&&!postcode.trim()){push({title:"Postcode required",body:"Enter postcode",color:"#dc2626"});return;}
    }
    var pcStr=selectedPostcode?selectedPostcode.postcode:postcode.toUpperCase();
    var addressLine1=doorNum+" "+streetName;
    var distance=selectedPostcode?calculateDistance(selectedPostcode.lat,selectedPostcode.lng):0;
    
    var c={
      id:"c"+Date.now(),
      phone:phone,
      name:name,
      address:{line1:addressLine1,postcode:pcStr,notes:notes},
      distance:distance,
      lastOrder:null,totalOrders:0,totalSpent:0,notes:"",
    };
    
    // Add to local state
    setCustomers(cs=>[...cs,c]);
    
    // Save to DB
    if(typeof dbSaveCustomer!=="undefined"){
      dbSaveCustomer({phone:phone,name:name,address:c.address,distance:distance,notes:""}).then(r=>{
        if(r&&r.data&&r.data.id){
          setCustomers(cs=>cs.map(x=>x.id===c.id?{...x,id:r.data.id,dbId:r.data.id}:x));
        }
      }).catch(e=>console.log("Customer save failed (kept locally):",e));
    }
    
    push({title:"Customer saved",body:c.name,color:"#059669"});
    onCustomerReady({customer:c,orderType:orderType});
  };

  // Existing customer - just confirm and continue
  var continueExisting=()=>{
    onCustomerReady({customer:found,orderType:orderType});
  };

  // On-screen keyboard helper
  // Helper: get current value/setter for active field
  var getActive=()=>{
    if(activeField==="phone")return [phone,setPhone,"numeric"];
    if(activeField==="postcode")return [postcode,setPostcode,"alphanumeric"];
    if(activeField==="name")return [name,setName,"alpha"];
    if(activeField==="door")return [doorNum,setDoorNum,"alphanumeric"];
    if(activeField==="street")return [streetName,setStreetName,"alpha"];
    if(activeField==="notes")return [notes,setNotes,"alpha"];
    return ["",()=>{},"alpha"];
  };
  var [activeVal,activeSetter,activeMode]=getActive();
  var submitActive=()=>{
    if(activeField==="phone")searchPhone();
    else if(activeField==="postcode")lookupPostcodeIO();
    else setActiveField(null); // close keyboard for text fields
  };

  // Calculate keyboard height based on size (5 rows of buttons + gaps + padding)
  var kbHeights={small:300,medium:370,large:450};
  var kbHeight=activeField?(kbHeights[keyboardSize]||370):0;

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"14px 14px 0 14px",paddingTop:14,overflow:"hidden"}}>
    <div style={{background:"#fafaf5",color:"#1a1208",borderRadius:14,maxWidth:600,width:"100%",height:"calc(100vh - "+(kbHeight+28)+"px)",maxHeight:"calc(100vh - "+(kbHeight+28)+"px)",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 50px rgba(0,0,0,.4)",transition:"height .3s, max-height .3s"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:2}}>PHONE ORDER</p>
          <h2 style={{fontSize:18,fontWeight:700}}>
            {step==="phone"?"Customer Phone Number":""}
            {step==="search"?"Searching...":""}
            {step==="existing"?"Existing Customer":""}
            {step==="postcode"?"New Customer - Postcode":""}
            {step==="address"?"Confirm Address":""}
          </h2>
        </div>
        <button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.15)",color:"#fff",border:"none",cursor:"pointer",fontSize:18,fontWeight:700}}>x</button>
      </div>

      {/* Content - scrollable */}
      <div style={{flex:1,overflowY:"auto",padding:18}}>

        {/* STEP: PHONE ENTRY */}
        {step==="phone"&&<>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div onClick={()=>setActiveField("phone")} style={{display:"inline-block",padding:"18px 30px",background:"#fff",borderRadius:13,fontSize:36,fontWeight:700,letterSpacing:4,minWidth:320,border:"3px solid #d4952a",color:"#1a1208",cursor:"text",boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}>
              {phone||<span style={{color:"#d4b896"}}>0XXXXXXXXXX</span>}
            </div>
            <p style={{fontSize:13,color:"#8a8078",marginTop:10,fontWeight:600}}>Enter customer phone number using keyboard below</p>
          </div>
        </>}

        {/* STEP: EXISTING CUSTOMER */}
        {step==="existing"&&found&&<>
          <div style={{padding:14,background:"#d1fae5",border:"2px solid #059669",borderRadius:11,marginBottom:14}}>
            <p style={{fontSize:11,color:"#065f46",fontWeight:700,letterSpacing:1,marginBottom:5}}>{EM.check} CUSTOMER FOUND</p>
            <h3 style={{fontSize:20,fontWeight:700,color:"#065f46"}}>{found.name}</h3>
            <p style={{fontSize:13,color:"#065f46",marginTop:3}}>{found.phone}</p>
          </div>

          <div className="card" style={{padding:12,marginBottom:11}}>
            <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:5}}>SAVED ADDRESS</p>
            {found.address?<div>
              <p style={{fontSize:14,fontWeight:600}}>{found.address.line1||"(no address)"}</p>
              <p style={{fontSize:13,color:"#8a8078"}}>{found.address.postcode||""}</p>
              {found.distance>0&&<p style={{fontSize:12,color:"#bf4626",marginTop:3}}>{(typeof found.distance==="number"?found.distance.toFixed(1):found.distance)} miles from branch</p>}
            </div>:<p style={{fontSize:13,color:"#8a8078",fontStyle:"italic"}}>No saved address - will need to add</p>}
            <button onClick={()=>{setName(found.name);setDoorNum(found.address?.line1?.split(" ")[0]||"");setStreetName(found.address?.line1?.split(" ").slice(1).join(" ")||"");setPostcode(found.address?.postcode||"");setStep("postcode");}} style={{marginTop:10,padding:"7px 12px",background:"#f7f3ee",border:"1px solid #ede8de",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Edit Address</button>
          </div>

          {found.totalOrders>0&&<div className="card" style={{padding:12,marginBottom:11,background:"#f5f3ff",borderLeft:"3px solid #7c3aed"}}>
            <p style={{fontSize:13,fontWeight:700,color:"#7c3aed"}}>{found.totalOrders} previous orders</p>
            <p style={{fontSize:12,color:"#7c3aed",marginTop:2}}>Total spent: {fmt(found.totalSpent||0)}</p>
          </div>}

          <p style={{fontSize:12,color:"#8a8078",fontWeight:700,marginBottom:6}}>Order Type:</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
            {[["delivery","Delivery"],["collection","Collection"]].map(([t,l])=><button key={t} onClick={()=>setOrderType(t)} style={{padding:"14px",borderRadius:9,fontWeight:700,fontSize:13,background:orderType===t?"#bf4626":"#fff",color:orderType===t?"#fff":"#1a1208",border:"2px solid "+(orderType===t?"#bf4626":"#ede8de"),cursor:"pointer"}}>{l}</button>)}
          </div>

          <button onClick={continueExisting} style={{width:"100%",padding:"15px",background:"#059669",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}}>{EM.check} Continue with this customer</button>
        </>}

        {/* STEP: POSTCODE ENTRY */}
        {step==="postcode"&&<>
          <p style={{fontSize:12,color:"#8a8078",marginBottom:8}}>Phone: <span style={{fontWeight:700,color:"#1a1208"}}>{phone}</span></p>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:5,display:"block"}}>POSTCODE</label>
            <div onClick={()=>setActiveField("postcode")} style={{padding:"16px 22px",background:"#fff",borderRadius:11,fontSize:30,fontWeight:700,letterSpacing:3,border:"3px solid #d4952a",color:"#1a1208",textAlign:"center",cursor:"text",boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}>
              {postcode||<span style={{color:"#d4b896"}}>E1 6AN</span>}
            </div>
          </div>

          <button onClick={lookupPostcodeIO} disabled={!postcode||lookingUp} style={{width:"100%",padding:"15px",background:lookingUp?"#8a8078":"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:lookingUp?"not-allowed":"pointer",marginBottom:11,boxShadow:"0 3px 8px rgba(37,99,235,.3)"}}>
            {lookingUp?"Looking up...":(String.fromCharCode(0xD83D,0xDD0D)+" Search Postcodes")}
          </button>

          {/* Postcode results */}
          {postcodeError&&<div style={{padding:11,background:"#fee2e2",border:"1px solid #dc2626",borderRadius:7,fontSize:12,color:"#991b1b",marginBottom:11}}>{postcodeError}</div>}

          {postcodeOptions.length>0&&<div style={{marginBottom:11}}>
            <p style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:6}}>SELECT POSTCODE ({postcodeOptions.length} found)</p>
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
              {postcodeOptions.map((pc,i)=><button key={i} onClick={()=>{setSelectedPostcode(pc);setPostcode(pc.postcode);setStep("address");}} style={{padding:"12px 14px",background:"#fff",border:"2px solid #ede8de",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{pc.postcode}</span>
                <span style={{fontSize:11,color:"#8a8078",fontWeight:400}}>{pc.area} - {calculateDistance(pc.lat,pc.lng).toFixed(1)} mi</span>
              </button>)}
            </div>
          </div>}

          <button onClick={()=>{setSelectedPostcode(null);setStep("address");}} style={{width:"100%",padding:"11px",background:"transparent",color:"#8a8078",border:"2px dashed #ede8de",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer"}}>Skip - Enter Address Manually</button>
        </>}

        {/* STEP: ADDRESS DETAILS */}
        {step==="address"&&<>
          <p style={{fontSize:12,color:"#8a8078",marginBottom:11}}>Phone: <span style={{fontWeight:700,color:"#1a1208"}}>{phone}</span> {selectedPostcode&&<>- Postcode: <span style={{fontWeight:700,color:"#1a1208"}}>{selectedPostcode.postcode}</span> ({calculateDistance(selectedPostcode.lat,selectedPostcode.lng).toFixed(1)} mi)</>}</p>

          <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:4,display:"block"}}>CUSTOMER NAME</label>
          <input value={name} onChange={e=>setName(e.target.value)} onClick={()=>setActiveField("name")} placeholder="Mr Smith" autoFocus className="field" style={{marginBottom:11,fontSize:18,padding:"14px 16px",borderColor:activeField==="name"?"#bf4626":undefined,borderWidth:activeField==="name"?2:1}}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8,marginBottom:11}}>
            <div>
              <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:4,display:"block"}}>DOOR / FLAT</label>
              <input value={doorNum} onChange={e=>setDoorNum(e.target.value)} onClick={()=>setActiveField("door")} placeholder="23" className="field" style={{fontSize:18,padding:"14px 16px",borderColor:activeField==="door"?"#bf4626":undefined,borderWidth:activeField==="door"?2:1}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:4,display:"block"}}>STREET / ROAD</label>
              <input value={streetName} onChange={e=>setStreetName(e.target.value)} onClick={()=>setActiveField("street")} placeholder="High Street" className="field" style={{fontSize:18,padding:"14px 16px",borderColor:activeField==="street"?"#bf4626":undefined,borderWidth:activeField==="street"?2:1}}/>
            </div>
          </div>

          {!selectedPostcode&&<>
            <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:4,display:"block"}}>POSTCODE</label>
            <input value={postcode} onChange={e=>setPostcode(e.target.value.toUpperCase())} onClick={()=>setActiveField("postcode")} placeholder="E1 6AN" className="field" style={{marginBottom:11,fontSize:18,padding:"14px 16px",textTransform:"uppercase",borderColor:activeField==="postcode"?"#bf4626":undefined,borderWidth:activeField==="postcode"?2:1}}/>
          </>}

          <label style={{fontSize:11,color:"#8a8078",fontWeight:700,letterSpacing:1,marginBottom:4,display:"block"}}>NOTES (OPTIONAL)</label>
          <input value={notes} onChange={e=>setNotes(e.target.value)} onClick={()=>setActiveField("notes")} placeholder="Gate code, buzzer name..." className="field" style={{marginBottom:14,fontSize:16,padding:"12px 16px",borderColor:activeField==="notes"?"#bf4626":undefined,borderWidth:activeField==="notes"?2:1}}/>

          <p style={{fontSize:12,color:"#8a8078",fontWeight:700,marginBottom:6}}>Order Type:</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
            {[["delivery","Delivery"],["collection","Collection"]].map(([t,l])=><button key={t} onClick={()=>setOrderType(t)} style={{padding:"14px",borderRadius:9,fontWeight:700,fontSize:13,background:orderType===t?"#bf4626":"#fff",color:orderType===t?"#fff":"#1a1208",border:"2px solid "+(orderType===t?"#bf4626":"#ede8de"),cursor:"pointer"}}>{l}</button>)}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:6}}>
            <button onClick={()=>setStep("postcode")} style={{padding:"15px",background:"#fff",color:"#1a1208",border:"2px solid #ede8de",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>{"< Back"}</button>
            <button onClick={confirmAddress} style={{padding:"15px",background:"#059669",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>{EM.check} Save & Take Order</button>
          </div>
        </>}

      </div>
    </div>
    
    {/* Slide-up keyboard - shows when activeField is set */}
    {activeField&&<SlideUpKeyboard mode={activeMode} value={activeVal} onChange={activeSetter} onSubmit={submitActive} onClose={()=>setActiveField(null)} sizePreset={keyboardSize}/>}
  </div>;
}

function PosV(props){
  var [uiStyle,setUiStyle]=useState(()=>{
    try{return localStorage.getItem("pos_ui_style")||"modern";}catch(e){return "modern";}
  });
  var [showDash,setShowDash]=useState(()=>{
    try{return localStorage.getItem("show_pos_dashboard")==="1";}catch(e){return false;}
  });
  var [dashOpen,setDashOpen]=useState(showDash); // true means show dashboard, false means show POS
  // Listen for storage changes (when user changes UI in settings)
  useEffect(()=>{
    var check=()=>{
      try{
        var current=localStorage.getItem("pos_ui_style")||"modern";
        var dashSetting=localStorage.getItem("show_pos_dashboard")==="1";
        if(current!==uiStyle)setUiStyle(current);
        if(dashSetting!==showDash)setShowDash(dashSetting);
      }catch(e){}
    };
    var interval=setInterval(check,1000);
    return()=>clearInterval(interval);
  },[uiStyle,showDash]);

  // If dashboard is enabled and currently showing, render dashboard
  if(showDash&&dashOpen){
    return <PosDashboard {...props} onOpenPos={()=>setDashOpen(false)}/>;
  }

  // Otherwise show selected POS UI with a "Back to Dashboard" button if dashboard is enabled
  var enhancedProps={...props,onBackToDash:showDash?()=>setDashOpen(true):null};
  if(uiStyle==="classic")return <PosVClassic {...enhancedProps}/>;
  if(uiStyle==="compact")return <PosVCompact {...enhancedProps}/>;
  return <PosVModern {...enhancedProps}/>;
}

// POS DASHBOARD - POSCUBE-style home screen with action tiles
function PosDashboard({orders,setOrders,user,branch,tables,setTables,stations,menu,customers,setView,onOpenPos,setUser,push}){
  var [modalView,setModalView]=useState(null); // null, "incoming", "kitchen", "tables", "driver", "bookings", "report"
  // Safety: ensure all props have defaults to prevent crashes
  orders=orders||[];
  tables=tables||[];
  if(!setView)setView=()=>{};
  if(!onOpenPos)onOpenPos=()=>{};
  // Live counts
  var pendingOrders=orders.filter(o=>!o.paid&&o.status!=="cancelled"&&(!branch||!o.branchId||o.branchId===branch.id));
  var dineInActive=pendingOrders.filter(o=>o.type==="dine-in"||o.type==="eatin").length;
  var takeawayActive=pendingOrders.filter(o=>o.type==="takeaway"||o.type==="collection").length;
  var deliveryActive=pendingOrders.filter(o=>o.type==="delivery"&&o.status!=="delivered").length;
  var pendingIncoming=orders.filter(o=>o.status==="pending"&&(!branch||!o.branchId||o.branchId===branch.id)).length;
  var occupiedTables=(tables||[]).filter(t=>t.status==="occupied"&&(!branch||!t.branchId||t.branchId===branch.id)).length;
  var totalTables=(tables||[]).filter(t=>!branch||!t.branchId||t.branchId===branch.id).length;
  var driverActive=orders.filter(o=>o.type==="delivery"&&(o.status==="ready"||o.status==="out_for_delivery")&&(!branch||!o.branchId||o.branchId===branch.id)).length;

  // Today's stats - extra defensive against bad date values
  var todayStr="";
  try{todayStr=new Date().toISOString().split("T")[0];}catch(e){todayStr="";}
  var todayOrders=[];
  try{
    todayOrders=orders.filter(o=>{
      if(!o)return false;
      if(branch&&o.branchId&&o.branchId!==branch.id)return false;
      if(!o.time)return false;
      // o.time might be "14:32" (just time) or full ISO date string
      // Only count it if it's a valid full date
      try{
        var t=String(o.time);
        // If it's just HH:MM format, treat it as today
        if(/^\d{1,2}:\d{2}/.test(t)&&t.length<=8)return true;
        var d=new Date(t);
        if(!d||isNaN(d.getTime()))return false;
        return d.toISOString().split("T")[0]===todayStr;
      }catch(err){return false;}
    });
  }catch(e){todayOrders=[];}
  var todayRevenue=0;
  try{todayRevenue=todayOrders.filter(o=>o.paid).reduce((s,o)=>s+(parseFloat(o.total)||0),0);}catch(e){todayRevenue=0;}

  // Tile config - each tile has: icon, label, color, badge count, action
  var tiles=[
    // ROW 1: TAKE NEW ORDERS (4 tiles)
    {icon:EM.cook,label:"Dine In",color:"#bf4626",bgGradient:"linear-gradient(135deg,#bf4626,#dc2626)",badge:dineInActive>0?dineInActive:null,sublabel:"Customer at table",onClick:()=>{try{window.__posInitialType="dine-in";}catch(e){}onOpenPos();}},
    {icon:EM.bag,label:"Walk-in Takeaway",color:"#d97706",bgGradient:"linear-gradient(135deg,#d97706,#f59e0b)",badge:takeawayActive>0?takeawayActive:null,sublabel:"At counter",onClick:()=>{try{window.__posInitialType="takeaway";}catch(e){}onOpenPos();}},
    {icon:EM.phone,label:"Phone Order",color:"#2563eb",bgGradient:"linear-gradient(135deg,#2563eb,#3b82f6)",badge:deliveryActive>0?deliveryActive:null,sublabel:"Delivery / collection",onClick:()=>{try{window.__posOpenPhonePopup=true;}catch(e){}onOpenPos();}},
    {icon:EM.bag,label:"Incoming",color:"#dc2626",bgGradient:"linear-gradient(135deg,#dc2626,#ef4444)",badge:pendingIncoming>0?pendingIncoming:null,sublabel:"Online & QR orders",onClick:()=>setModalView("incoming"),pulse:pendingIncoming>0},

    // ROW 2: MANAGE ACTIVE ORDERS (4 tiles)
    {icon:EM.cook,label:"Kitchen",color:"#059669",bgGradient:"linear-gradient(135deg,#059669,#10b981)",badge:null,sublabel:"What to cook",onClick:()=>setModalView("kitchen")},
    {icon:EM.pin,label:"Tables",color:"#0891b2",bgGradient:"linear-gradient(135deg,#0891b2,#06b6d4)",badge:occupiedTables>0?occupiedTables+"/"+totalTables:null,sublabel:"Floor view",onClick:()=>setModalView("tables")},
    {icon:EM.bag,label:"Driver",color:"#ea580c",bgGradient:"linear-gradient(135deg,#ea580c,#f97316)",badge:driverActive>0?driverActive:null,sublabel:"Deliveries",onClick:()=>setModalView("driver")},
    {icon:EM.cal,label:"Bookings",color:"#9333ea",bgGradient:"linear-gradient(135deg,#9333ea,#a855f7)",badge:null,sublabel:"Reservations",onClick:()=>setModalView("bookings")},

    // ROW 3: MANAGEMENT (3 tiles)
    {icon:EM.chart,label:"Reports",color:"#0d9488",bgGradient:"linear-gradient(135deg,#0d9488,#14b8a6)",badge:null,sublabel:"Sales & analytics",onClick:()=>setModalView("report")},
    {icon:EM.gear,label:"Admin",color:"#1f2937",bgGradient:"linear-gradient(135deg,#1f2937,#374151)",badge:null,sublabel:"Menu & settings",onClick:()=>setView("admin")},
    {icon:EM.cart,label:"Open POS",color:"#bf4626",bgGradient:"linear-gradient(135deg,#1a1208,#3d2e22)",badge:null,sublabel:"Direct to ordering",onClick:()=>onOpenPos()},
    {icon:String.fromCharCode(0x21AA,0xFE0F),label:"Exit / Logout",color:"#dc2626",bgGradient:"linear-gradient(135deg,#dc2626,#991b1b)",badge:null,sublabel:"Sign out from system",onClick:()=>{if(window.confirm("Sign out and return to login screen?")){if(setUser)setUser(null);if(setView)setView("menu");}}},
  ];

  return <div className="page" style={{padding:14,minHeight:"calc(100vh - 100px)",background:"linear-gradient(135deg,#fafaf5,#f0ede5)"}}>
    <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",borderRadius:14,padding:"15px 18px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
      <div>
        <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:2,marginBottom:3}}>POS DASHBOARD</p>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:2}}>Welcome back, {user?.name||"Staff"}</h2>
        <p style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{branch?.name} - {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})} - {nowT()}</p>
      </div>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700,letterSpacing:1}}>TODAY</p>
          <p style={{fontSize:20,fontWeight:700,color:"#d4952a"}}>{fmt(todayRevenue)}</p>
        </div>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700,letterSpacing:1}}>ORDERS</p>
          <p style={{fontSize:20,fontWeight:700,color:"#fff"}}>{todayOrders.length}</p>
        </div>
      </div>
    </div>

    {/* Quick stats bar */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:7,marginBottom:14}}>
      <div className="card" style={{padding:10,textAlign:"center"}}><p style={{fontSize:18,fontWeight:700,color:"#bf4626"}}>{dineInActive}</p><p style={{fontSize:10,color:"#8a8078",fontWeight:700,letterSpacing:1}}>DINE IN</p></div>
      <div className="card" style={{padding:10,textAlign:"center"}}><p style={{fontSize:18,fontWeight:700,color:"#d97706"}}>{takeawayActive}</p><p style={{fontSize:10,color:"#8a8078",fontWeight:700,letterSpacing:1}}>TAKEAWAY</p></div>
      <div className="card" style={{padding:10,textAlign:"center"}}><p style={{fontSize:18,fontWeight:700,color:"#7c3aed"}}>{deliveryActive}</p><p style={{fontSize:10,color:"#8a8078",fontWeight:700,letterSpacing:1}}>DELIVERY</p></div>
      <div className="card" style={{padding:10,textAlign:"center"}}><p style={{fontSize:18,fontWeight:700,color:"#0891b2"}}>{occupiedTables}/{totalTables}</p><p style={{fontSize:10,color:"#8a8078",fontWeight:700,letterSpacing:1}}>TABLES</p></div>
    </div>

    {/* Tile grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
      {tiles.map((tile,i)=><button key={i} onClick={tile.onClick} style={{background:tile.bgGradient,color:"#fff",border:"none",borderRadius:14,padding:"22px 14px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:5,minHeight:140,boxShadow:"0 4px 14px rgba(0,0,0,.12)",transition:"transform .15s",animation:tile.pulse?"pulse 1.5s ease-in-out infinite":"none"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} onTouchStart={e=>e.currentTarget.style.transform="scale(.96)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
        {tile.badge&&<span style={{position:"absolute",top:9,right:9,background:"#fff",color:tile.color,borderRadius:11,padding:"2px 9px",fontSize:11,fontWeight:700,minWidth:22,textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>{tile.badge}</span>}
        <span style={{fontSize:38,lineHeight:1,marginTop:5}}>{tile.icon}</span>
        <span style={{fontSize:14,fontWeight:700,letterSpacing:.5,textAlign:"center"}}>{tile.label}</span>
        {tile.sublabel&&<span style={{fontSize:10,fontWeight:400,opacity:.85,textAlign:"center",letterSpacing:.3}}>{tile.sublabel}</span>}
      </button>)}
    </div>

    {/* Footer note */}
    <div style={{marginTop:18,padding:"10px 12px",background:"#fff",borderRadius:9,border:"1px solid #ede8de",textAlign:"center"}}>
      <p style={{fontSize:11,color:"#8a8078"}}>To disable this dashboard, go to Admin {String.fromCharCode(0x2192)} Settings {String.fromCharCode(0x2192)} POS Dashboard Home Screen</p>
    </div>

    {/* MODAL VIEWS - Click tile opens these as overlays */}
    {modalView&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 14px"}}>
      <div style={{background:"#fafaf5",color:"#1a1208",borderRadius:14,maxWidth:1200,width:"100%",maxHeight:"calc(100vh - 40px)",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        {/* Modal header */}
        <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"3px solid #d4952a"}}>
          <div>
            <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:2,marginBottom:2}}>POS DASHBOARD</p>
            <h2 style={{fontSize:20,fontWeight:700}}>{
              modalView==="incoming"?(EM.bag+" Incoming Orders"):
              modalView==="kitchen"?(EM.cook+" Kitchen Stations"):
              modalView==="tables"?(EM.pin+" Tables - Floor View"):
              modalView==="driver"?(EM.bag+" Driver - Deliveries"):
              modalView==="bookings"?(EM.cal+" Bookings & Reservations"):
              modalView==="report"?(EM.chart+" Reports & Analytics"):
              "View"
            }</h2>
          </div>
          <button onClick={()=>setModalView(null)} style={{padding:"10px 18px",background:"linear-gradient(135deg,#dc2626,#991b1b)",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 8px rgba(220,38,38,.3)",display:"flex",alignItems:"center",gap:6}}>
            x Close
          </button>
        </div>
        {/* Modal content - scrollable */}
        <div style={{flex:1,overflowY:"auto",padding:14}}>
          {modalView==="incoming"&&<IncomingOrdersV orders={orders} setOrders={setOrders} push={push} branch={branch} customers={customers} tables={tables} setTables={setTables} stations={stations} menu={menu}/>}
          {modalView==="kitchen"&&<KitchenV orders={orders} setOrders={setOrders} push={push} stations={stations} menu={menu}/>}
          {modalView==="tables"&&<TablesV tables={tables} setTables={setTables} push={push} branch={branch} orders={orders} setOrders={setOrders} onGoToPos={tableId=>{setModalView(null);if(typeof window!=="undefined")window.__preselectedTable=tableId;onOpenPos();}}/>}
          {modalView==="driver"&&<DriverV orders={orders} setOrders={setOrders} push={push} user={user} branch={branch}/>}
          {modalView==="bookings"&&<StaffBookingsV branch={branch} push={push}/>}
          {modalView==="report"&&<ReportV orders={orders}/>}
        </div>
      </div>
    </div>}
  </div>;
}

// CLASSIC UI - POSCUBE-style with category buttons on left, items in middle, bill on right
// CLASSIC POSCUBE-style POS - traditional EPOS layout with categories on left, items in middle, bill on right
function PosVClassic({menu,onOrder,push,user,branch,tables,setTables,orders,onBackToDash,customers,setCustomers}){
  var [phoneCust,setPhoneCust]=useState(null);
  var [showPhonePopup,setShowPhonePopup]=useState(()=>{try{if(window.__posOpenPhonePopup){window.__posOpenPhonePopup=false;return true;}}catch(e){}return false;});
  var cats=[...new Set(menu.filter(i=>i.avail).map(i=>i.cat))];
  var [cat,setCat]=useState(cats[0]||"");
  var [cart,setCart]=useState([]);
  var [type,setType]=useState(()=>{try{var t=window.__posInitialType;if(t){window.__posInitialType=null;return t;}}catch(e){}return "dine-in";});
  var [tbl,setTbl]=useState("");
  var [guests,setGuests]=useState("1");
  var [discPct,setDiscPct]=useState(0);
  var [showDiscModal,setShowDiscModal]=useState(false);
  var [showSplitModal,setShowSplitModal]=useState(false);
  var [showClassicPicker,setShowClassicPicker]=useState(false);
  var [splitN,setSplitN]=useState(2);
  var [posDeliv,setPosDeliv]=useState(null);

  // Color palette for categories - rotates through traditional EPOS colors
  var catColors=["#f59e0b","#fbbf24","#fcd34d","#fb923c","#fca5a5","#a78bfa","#60a5fa","#34d399"];
  var getCatColor=(idx)=>catColors[idx%catColors.length];

  useEffect(()=>{
    if(!branch)return;
    dbFetchAllDelivery().then(list=>{
      var s=(list||[]).find(x=>x.branch_id===branch.id);
      if(s){
        setPosDeliv({
          serviceChargeEnabled:s.service_charge_enabled||false,
          serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
          serviceChargeMandatory:s.service_charge_mandatory||false,
        });
      }
    });
  },[branch]);

  // Calculations
  var rawSub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  var discAmt=rawSub*(discPct/100);
  var afterDisc=rawSub-discAmt;
  var posServiceApplies=type==="dine-in"&&posDeliv&&posDeliv.serviceChargeEnabled;
  var serviceCharge=posServiceApplies?afterDisc*((posDeliv.serviceChargePercent||0)/100):0;
  var total=afterDisc+serviceCharge;

  var add=(it)=>{
    var typePrice=getItemPrice(it,type);
    setCart(c=>{
      var ex=c.find(x=>x.id===it.id);
      if(ex){
        var others=c.filter(x=>x.id!==it.id);
        return [{...ex,qty:ex.qty+1,price:typePrice},...others];
      }
      return [{id:it.id,name:it.name,qty:1,price:typePrice},...c];
    });
  };
  var rem=(idx)=>setCart(c=>c.filter((_,i)=>i!==idx));
  var qtyChange=(idx,delta)=>setCart(c=>c.map((it,i)=>i===idx?{...it,qty:Math.max(1,it.qty+delta)}:it));
  var clear=()=>{setCart([]);setDiscPct(0);};

  // Send order to kitchen / save
  var sendOrder=(paid,payMethod)=>{
    if(cart.length===0){push({title:"Empty cart",body:"Add items first",color:"#dc2626"});return;}
    // VALIDATION: Dine-in requires table number
    if(type==="dine-in"&&!tbl){
      push({title:"Table required!",body:"Please select a table number for dine-in orders",color:"#dc2626"});
      if(typeof window!=="undefined"&&window.navigator&&window.navigator.vibrate){window.navigator.vibrate([50,50,50]);}
      return;
    }
    // Build customer info - use phone customer if set
    var customer,phoneNum,address,orderType,deliveryCode;
    if(phoneCust){
      customer=phoneCust.name+" ("+phoneCust.phone+")";
      phoneNum=phoneCust.phone;
      orderType=type==="takeaway"?"collection":(type==="dine-in"?"delivery":type);
      address=orderType==="delivery"?phoneCust.address:null;
      deliveryCode=String(Math.floor(1000+Math.random()*9000));
    }else{
      customer=type==="dine-in"?(tbl?"Table "+tbl:"Walk-in"):"Counter";
      phoneNum=null;address=null;orderType=type;deliveryCode=null;
    }
    var tableId=type==="dine-in"&&tbl?parseInt(tbl):null;
    // CONFLICT CHECK: If another order exists for this table already, warn
    if(tableId&&orders){
      var existing=orders.filter(o=>o.tableId===tableId&&o.branchId===branch?.id&&!o.paid&&!["delivered","collected","cancelled"].includes(o.status));
      if(existing.length>0){
        var otherOrder=existing[0];
        var msg="Table "+tableId+" already has an active order ("+otherOrder.id+") by "+(otherOrder.takenBy||otherOrder.customer)+" totaling "+fmt(otherOrder.total)+".\n\nOK = Add to existing bill (recommended)\nCancel = Don't send this order";
        if(!window.confirm(msg))return;
      }
    }
    var o={
      id:uid(),branchId:branch?.id,userId:phoneCust?phoneCust.id:(user?.id||"staff"),customer,phone:phoneNum,
      items:[...cart],subtotal:rawSub,discount:discAmt,
      serviceCharge:serviceCharge,total:total,
      status:"preparing",time:nowT(),type:orderType,
      paid:paid||false,payMethod:payMethod||null,takenBy:user?.name,
      tableId,source:phoneCust?"phone":"staff",guests:parseInt(guests)||1,
      address:address,deliveryCode:deliveryCode,phoneCustomer:phoneCust?true:false,
    };
    onOrder(o);
    if(type==="dine-in"&&tbl){
      var tnum=parseInt(tbl);
      setTables(ts=>ts.map(t=>(t.id===tnum||t.id===String(tnum))&&t.branchId===branch?.id?{...t,status:"occupied",guests:parseInt(guests)||1}:t));
    }
    var msgBody=phoneCust?(phoneCust.name+(deliveryCode?" - Code: "+deliveryCode:"")):(o.id+" - "+fmt(total));
    push({title:paid?"Paid - sent to kitchen":(phoneCust?"Phone order sent":"Sent to kitchen"),body:msgBody,color:paid?"#059669":"#2563eb"});
    clear();
    setPhoneCust(null);
    if(onBackToDash)setTimeout(()=>onBackToDash(),300);
  };

  // Filter and dedupe items in current category
  var visibleItems=(()=>{
    var seen=new Set();
    return menu.filter(i=>i.cat===cat&&i.avail&&isItemAvailable(i,type)).filter(i=>{
      var key=(i.name||"").toLowerCase().trim();
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  })();

  return <div style={{height:"calc(100vh - 100px)",display:"flex",flexDirection:"column",background:"#1a1208",color:"#fff",margin:-16,padding:8,overflow:"hidden"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
    {showPhonePopup&&<PhoneCustomerPopup customers={customers} setCustomers={setCustomers} push={push} branch={branch} initialPhone="" onClose={()=>setShowPhonePopup(false)} onCustomerReady={(data)=>{setPhoneCust(data.customer);setType(data.orderType==="collection"?"takeaway":"takeaway");setShowPhonePopup(false);push({title:"Phone customer ready",body:data.customer.name+" - "+data.orderType,color:"#059669"});}}/>}
    
    {/* Phone customer banner */}
    {phoneCust&&<div style={{background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",padding:"8px 12px",borderRadius:8,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
      <div style={{flex:1,minWidth:200}}>
        <p style={{fontSize:9,fontWeight:700,letterSpacing:2,opacity:.85}}>PHONE ORDER</p>
        <p style={{fontSize:13,fontWeight:700}}>{phoneCust.name} - {phoneCust.phone}</p>
        {phoneCust.address&&<p style={{fontSize:10,opacity:.85}}>{EM.pin} {phoneCust.address.line1}, {phoneCust.address.postcode}</p>}
      </div>
      <button onClick={()=>setPhoneCust(null)} style={{padding:"5px 10px",borderRadius:5,fontSize:10,fontWeight:700,background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",cursor:"pointer"}}>Clear</button>
    </div>}
    
    {/* Top bar - branch info + order type + table */}
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"linear-gradient(135deg,#2d1f12,#3d2e22)",borderRadius:8,marginBottom:6,flexWrap:"wrap"}}>
      {onBackToDash&&<button onClick={onBackToDash} style={{padding:"6px 11px",borderRadius:6,fontSize:11,fontWeight:700,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer"}}>{"< Dashboard"}</button>}
      <button onClick={()=>setShowPhonePopup(true)} style={{padding:"6px 11px",borderRadius:6,fontSize:11,fontWeight:700,background:"#2563eb",color:"#fff",border:"none",cursor:"pointer"}}>{EM.phone} Phone</button>
      <div style={{flex:1,minWidth:120}}>
        <p style={{fontSize:11,color:"rgba(255,255,255,.6)",fontWeight:700,letterSpacing:1}}>POSCUBE STYLE</p>
        <p style={{fontSize:14,fontWeight:700,color:"#d4952a"}}>{branch?.name} - {user?.name}</p>
      </div>
      <div style={{display:"flex",gap:4,background:"rgba(0,0,0,.3)",borderRadius:7,padding:3}}>
        {[["dine-in","Dine In"],["takeaway","Takeaway"]].map(([tp,lb])=><button key={tp} onClick={()=>{setType(tp);setCart(c=>c.map(it=>{var m=menu.find(x=>String(x.id)===String(it.id));return{...it,price:m?getItemPrice(m,tp):it.price};}));}} style={{padding:"6px 14px",borderRadius:5,fontSize:12,fontWeight:700,background:type===tp?"#bf4626":"transparent",color:"#fff",border:"none",cursor:"pointer"}}>{lb}</button>)}
      </div>
      {type==="dine-in"&&<>
        <input value={tbl} onChange={e=>setTbl(e.target.value)} placeholder="Table #" style={{width:70,padding:"6px 8px",borderRadius:6,border:"2px solid "+(!tbl?"#fbbf24":"#d4952a"),background:!tbl?"#fef3c7":"#fff",color:!tbl?"#92400e":"#1a1208",fontWeight:700,textAlign:"center",fontSize:13}}/>
        <button onClick={()=>setShowClassicPicker(true)} style={{padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:"#d4952a",color:"#1a1208",border:"none",cursor:"pointer"}}>Pick</button>
        <input value={guests} onChange={e=>setGuests(e.target.value)} placeholder="Guests" style={{width:70,padding:"6px 8px",borderRadius:6,border:"2px solid #d4952a",background:"#fff",color:"#1a1208",fontWeight:700,textAlign:"center",fontSize:13}}/>
      </>}
    </div>

    {/* Main area - 3 columns */}
    <div style={{flex:1,display:"flex",gap:6,minHeight:0}}>
      {/* LEFT: Categories sidebar */}
      <div style={{width:108,display:"flex",flexDirection:"column",gap:3,overflowY:"auto",background:"#0f0a05",borderRadius:8,padding:5}}>
        {cats.map((c,idx)=>{
          var color=getCatColor(idx);
          var isActive=cat===c;
          var count=menu.filter(m=>m.cat===c&&m.avail).length;
          return <button key={c} onClick={()=>setCat(c)} style={{padding:"10px 6px",background:isActive?color:"#2d1f12",color:isActive?"#1a1208":"#fff",border:"2px solid "+color,borderRadius:6,fontWeight:700,fontSize:11,cursor:"pointer",lineHeight:1.2,minHeight:48,display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <span>{c}</span>
            <span style={{fontSize:9,opacity:.85,fontWeight:400,marginTop:2}}>{count} items</span>
          </button>;
        })}
      </div>

      {/* MIDDLE: Items grid */}
      <div style={{flex:1,background:"#fafaf5",borderRadius:8,padding:6,overflowY:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:5}}>
          {visibleItems.map(item=>{
            var price=getItemPrice(item,type);
            var inCart=cart.find(c=>c.id===item.id);
            var idx=cats.indexOf(item.cat);
            var color=getCatColor(idx);
            return <button key={item.dbId||item.id} onClick={()=>add(item)} disabled={item.stock===0} style={{padding:"10px 6px",background:inCart?"#fff":color,color:"#1a1208",border:"3px solid "+(inCart?"#bf4626":color),borderRadius:7,fontWeight:700,fontSize:11,cursor:item.stock===0?"not-allowed":"pointer",opacity:item.stock===0?.4:1,position:"relative",minHeight:62,boxShadow:"0 2px 4px rgba(0,0,0,.15)"}}>
              {inCart&&<div style={{position:"absolute",top:-7,right:-7,background:"#bf4626",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,border:"2px solid #fff"}}>{inCart.qty}</div>}
              <div style={{fontWeight:700,marginBottom:2,lineHeight:1.1}}>{item.name.toUpperCase()}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#7c2d12"}}>{fmt(price)}</div>
            </button>;
          })}
        </div>
        {visibleItems.length===0&&<div style={{textAlign:"center",padding:50,color:"#8a8078"}}>
          <p style={{fontSize:32}}>{EM.cook}</p>
          <p style={{fontSize:13,marginTop:10}}>No items in {cat}</p>
        </div>}
      </div>

      {/* RIGHT: Running bill */}
      <div style={{width:240,display:"flex",flexDirection:"column",background:"#fff",color:"#1a1208",borderRadius:8,overflow:"hidden"}}>
        <div style={{background:type==="dine-in"&&!tbl?"#dc2626":"#1a1208",color:"#fff",padding:"7px 10px",fontWeight:700,fontSize:12,textAlign:"center"}}>
          {type==="dine-in"?(tbl?"Dine In - Table "+tbl+" - Guest: "+guests:"DINE IN - PICK A TABLE!"):"Takeaway"}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:6}}>
          {cart.length===0?<p style={{fontSize:11,color:"#8a8078",textAlign:"center",padding:20}}>Tap items to add</p>:cart.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px dashed #ede8de",fontSize:11}}>
            <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>qtyChange(i,-1)} style={{width:18,height:18,borderRadius:3,border:"1px solid #ddd",background:"#f7f3ee",cursor:"pointer",fontWeight:700,fontSize:10}}>-</button>
              <span style={{fontWeight:700,minWidth:18,textAlign:"center"}}>{it.qty}</span>
              <button onClick={()=>qtyChange(i,1)} style={{width:18,height:18,borderRadius:3,border:"1px solid #ddd",background:"#f7f3ee",cursor:"pointer",fontWeight:700,fontSize:10}}>+</button>
              <span style={{fontSize:10,marginLeft:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.name}</span>
            </div>
            <span style={{fontWeight:700,marginLeft:4}}>{fmt(it.price*it.qty)}</span>
            <button onClick={()=>rem(i)} style={{marginLeft:3,width:16,height:16,borderRadius:3,background:"#fee2e2",color:"#dc2626",border:"none",cursor:"pointer",fontSize:10,fontWeight:700}}>x</button>
          </div>)}
        </div>
        <div style={{padding:"7px 10px",borderTop:"2px solid #ede8de",background:"#fafaf5"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a8078"}}><span>Subtotal</span><span>{fmt(rawSub)}</span></div>
          {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#dc2626"}}><span>Disc {discPct}%</span><span>-{fmt(discAmt)}</span></div>}
          {serviceCharge>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#7c3aed"}}><span>Service</span><span>+{fmt(serviceCharge)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:700,color:"#bf4626",marginTop:4,paddingTop:4,borderTop:"1px solid #ede8de"}}><span>Amount Due:</span><span>{fmt(total)}</span></div>
        </div>
      </div>
    </div>

    {/* Warning banner - dine-in needs table */}
    {type==="dine-in"&&!tbl&&cart.length>0&&<div style={{padding:"8px 12px",background:"#dc2626",color:"#fff",borderRadius:7,marginTop:6,fontSize:12,fontWeight:700,textAlign:"center",animation:"pulse 1.5s ease-in-out infinite"}}>
      Pick a table number to send the order. Click the yellow Pick button at the top.
    </div>}

    {/* Bottom action bar */}
    <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
      <button onClick={clear} style={{padding:"10px 14px",background:"#dc2626",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:12,cursor:"pointer",minWidth:80}}>Cancel</button>
      <button onClick={()=>setShowDiscModal(true)} disabled={cart.length===0} style={{padding:"10px 14px",background:"#d4952a",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:12,cursor:cart.length===0?"not-allowed":"pointer",opacity:cart.length===0?.5:1,minWidth:80}}>Discount</button>
      <button onClick={()=>setShowSplitModal(true)} disabled={cart.length===0||type!=="dine-in"} style={{padding:"10px 14px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:12,cursor:cart.length===0||type!=="dine-in"?"not-allowed":"pointer",opacity:cart.length===0||type!=="dine-in"?.5:1,minWidth:80}}>Split Bill</button>
      <div style={{flex:1}}/>
      <button onClick={()=>sendOrder(false,null)} disabled={cart.length===0||(type==="dine-in"&&!tbl)} style={{padding:"10px 18px",background:"#2563eb",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:cart.length===0||(type==="dine-in"&&!tbl)?"not-allowed":"pointer",opacity:cart.length===0||(type==="dine-in"&&!tbl)?.5:1,minWidth:120}}>Send to Kitchen</button>
      <button onClick={()=>sendOrder(true,"cash")} disabled={cart.length===0||(type==="dine-in"&&!tbl)} style={{padding:"10px 18px",background:"#059669",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:cart.length===0||(type==="dine-in"&&!tbl)?"not-allowed":"pointer",opacity:cart.length===0||(type==="dine-in"&&!tbl)?.5:1,minWidth:90}}>Pay Cash</button>
      <button onClick={()=>sendOrder(true,"card")} disabled={cart.length===0||(type==="dine-in"&&!tbl)} style={{padding:"10px 18px",background:"#bf4626",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:cart.length===0||(type==="dine-in"&&!tbl)?"not-allowed":"pointer",opacity:cart.length===0||(type==="dine-in"&&!tbl)?.5:1,minWidth:90}}>Pay Card</button>
    </div>

    {/* Discount modal */}
    {showDiscModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99,padding:14}} onClick={()=>setShowDiscModal(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",color:"#1a1208",borderRadius:11,padding:18,maxWidth:340,width:"100%"}}>
        <h3 style={{fontSize:16,marginBottom:9}}>Apply Discount</h3>
        <p style={{fontSize:12,color:"#8a8078",marginBottom:11}}>Quick percentages:</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:11}}>
          {[5,10,15,20,25,50].map(p=><button key={p} onClick={()=>setDiscPct(p)} style={{padding:"11px",background:discPct===p?"#bf4626":"#f7f3ee",color:discPct===p?"#fff":"#1a1208",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:"pointer"}}>{p}%</button>)}
        </div>
        <input type="number" value={discPct} onChange={e=>setDiscPct(Math.max(0,Math.min(100,+e.target.value)))} placeholder="Custom %" style={{width:"100%",padding:"9px",border:"2px solid #ede8de",borderRadius:7,fontSize:14,textAlign:"center",marginBottom:11}}/>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setDiscPct(0);setShowDiscModal(false);}} style={{flex:1,padding:"10px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,fontWeight:700,cursor:"pointer"}}>Remove</button>
          <button onClick={()=>setShowDiscModal(false)} style={{flex:1,padding:"10px",background:"#1a1208",color:"#fff",border:"none",borderRadius:7,fontWeight:700,cursor:"pointer"}}>Apply</button>
        </div>
      </div>
    </div>}

    {/* Split bill modal */}
    {showSplitModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99,padding:14}} onClick={()=>setShowSplitModal(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",color:"#1a1208",borderRadius:11,padding:18,maxWidth:340,width:"100%"}}>
        <h3 style={{fontSize:16,marginBottom:9}}>Split Bill</h3>
        <p style={{fontSize:12,color:"#8a8078",marginBottom:11}}>How many ways to split?</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:11}}>
          {[2,3,4,5,6,8].map(n=><button key={n} onClick={()=>setSplitN(n)} style={{padding:"11px",background:splitN===n?"#7c3aed":"#f7f3ee",color:splitN===n?"#fff":"#1a1208",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:"pointer"}}>{n} ways</button>)}
        </div>
        <div style={{padding:"11px",background:"#f5f3ff",borderRadius:7,marginBottom:11,textAlign:"center"}}>
          <p style={{fontSize:11,color:"#7c3aed",fontWeight:700}}>Each person pays</p>
          <p style={{fontSize:22,fontWeight:700,color:"#7c3aed"}}>{fmt(total/splitN)}</p>
        </div>
        <button onClick={()=>setShowSplitModal(false)} style={{width:"100%",padding:"10px",background:"#1a1208",color:"#fff",border:"none",borderRadius:7,fontWeight:700,cursor:"pointer"}}>Done</button>
      </div>
    </div>}

    {/* Classic Table Picker Modal */}
    {showClassicPicker&&(()=>{
      var branchTables=tables?tables.filter(t=>!t.branchId||t.branchId===branch?.id).sort((a,b)=>(+a.id)-(+b.id)):[];
      var statusColor={free:"#10b981",occupied:"#dc2626",reserved:"#d4952a"};
      var statusBg={free:"#d1fae5",occupied:"#fee2e2",reserved:"#fef3c7"};
      return <div onClick={()=>setShowClassicPicker(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",color:"#1a1208",borderRadius:14,padding:18,maxWidth:540,width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
            <h3 style={{fontSize:18,fontWeight:700}}>Pick a Table</h3>
            <button onClick={()=>setShowClassicPicker(false)} style={{width:32,height:32,borderRadius:"50%",background:"#f7f3ee",border:"none",cursor:"pointer",fontSize:16,fontWeight:700}}>x</button>
          </div>
          {branchTables.length===0?<p style={{textAlign:"center",padding:30,color:"#8a8078"}}>No tables configured for this branch.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:6}}>
            {branchTables.map(t=>{var st=t.status||"free";return <button key={t.id} onClick={()=>{setTbl(String(t.id));setShowClassicPicker(false);}} style={{padding:"14px 8px",border:"3px solid "+statusColor[st],borderRadius:9,background:statusBg[st],color:statusColor[st],fontWeight:700,cursor:"pointer",textAlign:"center"}}>
              <p style={{fontSize:18,fontWeight:700,marginBottom:2}}>T{t.id}</p>
              <p style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{st}</p>
              <p style={{fontSize:9,marginTop:2}}>{t.seats||4} seats</p>
            </button>;})}
          </div>}
          <div style={{display:"flex",gap:8,marginTop:14,fontSize:11,justifyContent:"center"}}>
            <span><span style={{display:"inline-block",width:10,height:10,background:"#10b981",borderRadius:2,marginRight:3}}/> Free</span>
            <span><span style={{display:"inline-block",width:10,height:10,background:"#dc2626",borderRadius:2,marginRight:3}}/> Occupied</span>
            <span><span style={{display:"inline-block",width:10,height:10,background:"#d4952a",borderRadius:2,marginRight:3}}/> Reserved</span>
          </div>
        </div>
      </div>;
    })()}
  </div>;
}
function PosVCompact({menu,onOrder,push,user,branch,tables,setTables,orders,onBackToDash,customers,setCustomers}){
  var [phoneCust,setPhoneCust]=useState(null);
  var [showPhonePopup,setShowPhonePopup]=useState(()=>{try{if(window.__posOpenPhonePopup){window.__posOpenPhonePopup=false;return true;}}catch(e){}return false;});
  var cats=[...new Set(menu.filter(i=>i.avail).map(i=>i.cat))];
  var [cat,setCat]=useState(cats[0]||"");
  var [cart,setCart]=useState([]);
  var [type,setType]=useState(()=>{try{var t=window.__posInitialType;if(t){window.__posInitialType=null;return t;}}catch(e){}return "dine-in";});
  var [tbl,setTbl]=useState("");
  var [showCart,setShowCart]=useState(false);
  var [search,setSearch]=useState("");
  var [posDeliv,setPosDeliv]=useState(null);

  useEffect(()=>{
    if(!branch)return;
    dbFetchAllDelivery().then(list=>{
      var s=(list||[]).find(x=>x.branch_id===branch.id);
      if(s){
        setPosDeliv({
          serviceChargeEnabled:s.service_charge_enabled||false,
          serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
        });
      }
    });
  },[branch]);

  // Calculations
  var rawSub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  var posServiceApplies=type==="dine-in"&&posDeliv&&posDeliv.serviceChargeEnabled;
  var serviceCharge=posServiceApplies?rawSub*((posDeliv.serviceChargePercent||0)/100):0;
  var total=rawSub+serviceCharge;
  var totalQty=cart.reduce((s,i)=>s+i.qty,0);

  var add=(it)=>{
    var typePrice=getItemPrice(it,type);
    setCart(c=>{
      var ex=c.find(x=>x.id===it.id);
      if(ex){
        return c.map(x=>x.id===it.id?{...x,qty:x.qty+1,price:typePrice}:x);
      }
      return [...c,{id:it.id,name:it.name,qty:1,price:typePrice}];
    });
    // Mini haptic feedback feel - flash effect on cart button
  };
  var qtyChange=(idx,delta)=>setCart(c=>c.map((it,i)=>i===idx?{...it,qty:Math.max(0,it.qty+delta)}:it).filter(it=>it.qty>0));
  var rem=(idx)=>setCart(c=>c.filter((_,i)=>i!==idx));
  var clear=()=>{setCart([]);setShowCart(false);};

  var sendOrder=(paid,payMethod)=>{
    if(cart.length===0){push({title:"Empty cart",body:"Add items first",color:"#dc2626"});return;}
    // VALIDATION: Dine-in requires table number
    if(type==="dine-in"&&!tbl){
      push({title:"Table required!",body:"Please enter a table number for dine-in orders",color:"#dc2626"});
      if(typeof window!=="undefined"&&window.navigator&&window.navigator.vibrate){window.navigator.vibrate([50,50,50]);}
      return;
    }
    var customer,phoneNum,address,orderType,deliveryCode;
    if(phoneCust){
      customer=phoneCust.name+" ("+phoneCust.phone+")";
      phoneNum=phoneCust.phone;
      orderType=type==="takeaway"?"collection":(type==="dine-in"?"delivery":type);
      address=orderType==="delivery"?phoneCust.address:null;
      deliveryCode=String(Math.floor(1000+Math.random()*9000));
    }else{
      customer=type==="dine-in"?(tbl?"Table "+tbl:"Walk-in"):"Counter";
      phoneNum=null;address=null;orderType=type;deliveryCode=null;
    }
    var tableId=type==="dine-in"&&tbl?parseInt(tbl):null;
    var o={
      id:uid(),branchId:branch?.id,userId:phoneCust?phoneCust.id:(user?.id||"staff"),customer,phone:phoneNum,
      items:[...cart],subtotal:rawSub,discount:0,
      serviceCharge:serviceCharge,total:total,
      status:paid?"preparing":"pending",time:nowT(),type:orderType,
      paid:paid||false,payMethod:payMethod||null,takenBy:user?.name,
      tableId,source:phoneCust?"phone":"staff",
      address:address,deliveryCode:deliveryCode,phoneCustomer:phoneCust?true:false,
    };
    onOrder(o);
    if(type==="dine-in"&&tbl){
      var tnum=parseInt(tbl);
      setTables(ts=>ts.map(t=>(t.id===tnum||t.id===String(tnum))&&t.branchId===branch?.id?{...t,status:"occupied"}:t));
    }
    var msgBody=phoneCust?(phoneCust.name+(deliveryCode?" - Code: "+deliveryCode:"")):(o.id+" - "+fmt(total));
    push({title:paid?"Paid - sent":(phoneCust?"Phone order sent":"Sent to kitchen"),body:msgBody,color:paid?"#059669":"#2563eb"});
    clear();
    setPhoneCust(null);
    if(onBackToDash)setTimeout(()=>onBackToDash(),300);
  };

  // Filter items - search OR category
  var visibleItems=(()=>{
    var seen=new Set();
    var q=search.trim().toLowerCase();
    return menu.filter(i=>{
      if(!i.avail)return false;
      if(!isItemAvailable(i,type))return false;
      if(q){
        var hay=(i.name+" "+(i.desc||"")+" "+(i.cat||"")).toLowerCase();
        return hay.includes(q);
      }
      return i.cat===cat;
    }).filter(i=>{
      var key=(i.name||"").toLowerCase().trim();
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  })();

  return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 100px)",margin:-16,position:"relative",overflow:"hidden"}}>
    {showPhonePopup&&<PhoneCustomerPopup customers={customers} setCustomers={setCustomers} push={push} branch={branch} initialPhone="" onClose={()=>setShowPhonePopup(false)} onCustomerReady={(data)=>{setPhoneCust(data.customer);setType("takeaway");setShowPhonePopup(false);push({title:"Phone customer ready",body:data.customer.name,color:"#059669"});}}/>}
    
    {/* Phone customer banner */}
    {phoneCust&&<div style={{background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:9,fontWeight:700,letterSpacing:1,opacity:.85}}>PHONE</p>
        <p style={{fontSize:11,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{phoneCust.name} - {phoneCust.phone}</p>
      </div>
      <button onClick={()=>setPhoneCust(null)} style={{padding:"4px 8px",borderRadius:5,fontSize:10,fontWeight:700,background:"rgba(255,255,255,.15)",color:"#fff",border:"none",cursor:"pointer"}}>Clear</button>
    </div>}
    
    {/* Top bar - super compact */}
    <div style={{padding:"7px 10px",background:"#1a1208",color:"#fff",display:"flex",gap:6,alignItems:"center"}}>
      {onBackToDash&&<button onClick={onBackToDash} style={{padding:"5px 9px",borderRadius:5,fontSize:11,fontWeight:700,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer"}}>{"<"}</button>}
      <button onClick={()=>setShowPhonePopup(true)} style={{padding:"5px 9px",borderRadius:5,fontSize:11,fontWeight:700,background:"#2563eb",color:"#fff",border:"none",cursor:"pointer"}}>{EM.phone}</button>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,color:"#d4952a",fontWeight:700}}>COMPACT POS</p>
        <p style={{fontSize:11,color:"rgba(255,255,255,.7)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{branch?.name}</p>
      </div>
      <div style={{display:"flex",gap:3,background:"rgba(0,0,0,.3)",borderRadius:6,padding:2}}>
        {[["dine-in","Dine"],["takeaway","Take"]].map(([tp,lb])=><button key={tp} onClick={()=>{setType(tp);setCart(c=>c.map(it=>{var m=menu.find(x=>String(x.id)===String(it.id));return{...it,price:m?getItemPrice(m,tp):it.price};}));}} style={{padding:"5px 10px",borderRadius:4,fontSize:11,fontWeight:700,background:type===tp?"#bf4626":"transparent",color:"#fff",border:"none",cursor:"pointer"}}>{lb}</button>)}
      </div>
      {type==="dine-in"&&<input value={tbl} onChange={e=>setTbl(e.target.value)} placeholder="T#" style={{width:42,padding:"5px",borderRadius:5,border:"none",fontSize:12,fontWeight:700,textAlign:"center",background:!tbl?"#fef3c7":"#fff",color:!tbl?"#92400e":"#1a1208"}}/>}
    </div>

    {/* Search */}
    <div style={{padding:"6px 8px",background:"#fafaf5",borderBottom:"1px solid #ede8de"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={String.fromCharCode(0x1F50D >> 10)+String.fromCharCode((0x1F50D & 0x3FF)|0xDC00)+" Quick search items..."} style={{width:"100%",padding:"7px 10px",border:"2px solid #ede8de",borderRadius:7,fontSize:12,background:"#fff"}}/>
    </div>

    {/* Categories - horizontal scroll - hidden when searching */}
    {!search&&<div style={{display:"flex",gap:4,overflowX:"auto",padding:"6px 8px",background:"#fafaf5",borderBottom:"1px solid #ede8de"}}>
      {cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"7px 13px",borderRadius:6,fontWeight:700,fontSize:11,whiteSpace:"nowrap",border:"2px solid",borderColor:cat===c?"#bf4626":"#ede8de",background:cat===c?"#bf4626":"#fff",color:cat===c?"#fff":"#1a1208",cursor:"pointer",flexShrink:0}}>{c}</button>)}
    </div>}

    {/* Items - 2 column grid for phones */}
    <div style={{flex:1,overflowY:"auto",padding:7,paddingBottom:80}}>
      {visibleItems.length===0?<div style={{textAlign:"center",padding:40,color:"#8a8078"}}>
        <p style={{fontSize:32}}>{search?String.fromCharCode(0x1F50D >> 10)+String.fromCharCode((0x1F50D & 0x3FF)|0xDC00):EM.cook}</p>
        <p style={{fontSize:13,marginTop:8}}>{search?"No items match":"No items"}</p>
      </div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {visibleItems.map(item=>{
          var price=getItemPrice(item,type);
          var inCart=cart.find(c=>c.id===item.id);
          return <button key={item.dbId||item.id} onClick={()=>add(item)} disabled={item.stock===0} style={{padding:"11px 8px",background:inCart?"#fff5f3":"#fff",color:"#1a1208",border:"2px solid "+(inCart?"#bf4626":"#ede8de"),borderRadius:9,cursor:"pointer",opacity:item.stock===0?.4:1,position:"relative",textAlign:"left",minHeight:78}}>
            {inCart&&<div style={{position:"absolute",top:-6,right:-6,background:"#bf4626",color:"#fff",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,border:"2px solid #fff"}}>{inCart.qty}</div>}
            <div style={{fontSize:18,marginBottom:3}}>{EM[item.icon]||""}</div>
            <p style={{fontSize:12,fontWeight:700,marginBottom:2,lineHeight:1.2}}>{item.name}</p>
            <p style={{fontSize:13,fontWeight:700,color:"#bf4626"}}>{fmt(price)}</p>
          </button>;
        })}
      </div>}
    </div>

    {/* Floating cart button - bottom */}
    {cart.length>0&&!showCart&&<button onClick={()=>setShowCart(true)} style={{position:"fixed",bottom:80,left:14,right:14,padding:"14px 18px",background:"linear-gradient(135deg,#bf4626,#dc2626)",color:"#fff",border:"none",borderRadius:14,fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 6px 20px rgba(191,70,38,.4)",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:50}}>
      <span style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{background:"rgba(255,255,255,.25)",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{totalQty}</span>
        View Cart
      </span>
      <span style={{fontSize:17,fontWeight:700}}>{fmt(total)}</span>
    </button>}

    {/* Slide-up cart panel */}
    {showCart&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:60}} onClick={()=>setShowCart(false)}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderRadius:"16px 16px 0 0",maxHeight:"80vh",display:"flex",flexDirection:"column",animation:"slideUp .25s ease-out"}}>
        <div style={{padding:"12px 14px",borderBottom:"2px solid #ede8de",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:700}}>Order {totalQty} item{totalQty!==1?"s":""}</h3>
            <p style={{fontSize:11,color:"#8a8078"}}>{type==="dine-in"?(tbl?"Table "+tbl:"Walk-in"):"Takeaway"}</p>
          </div>
          <button onClick={()=>setShowCart(false)} style={{width:32,height:32,borderRadius:"50%",background:"#f7f3ee",border:"none",cursor:"pointer",fontSize:16,fontWeight:700}}>x</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"8px 14px"}}>
          {cart.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:"1px solid #f5f0e8"}}>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:700}}>{it.name}</p>
              <p style={{fontSize:11,color:"#8a8078"}}>{fmt(it.price)} each</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#f7f3ee",borderRadius:18,padding:"3px 8px"}}>
              <button onClick={()=>qtyChange(i,-1)} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontSize:16,fontWeight:700,color:"#bf4626"}}>-</button>
              <span style={{fontWeight:700,minWidth:18,textAlign:"center"}}>{it.qty}</span>
              <button onClick={()=>qtyChange(i,1)} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontSize:16,fontWeight:700,color:"#059669"}}>+</button>
            </div>
            <p style={{fontWeight:700,fontSize:13,color:"#bf4626",minWidth:54,textAlign:"right"}}>{fmt(it.price*it.qty)}</p>
            <button onClick={()=>rem(i)} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontWeight:700}}>x</button>
          </div>)}
        </div>

        <div style={{padding:"10px 14px",borderTop:"2px solid #ede8de",background:"#fafaf5"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8a8078"}}><span>Subtotal</span><span>{fmt(rawSub)}</span></div>
          {serviceCharge>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7c3aed",fontWeight:700}}><span>Service ({posDeliv.serviceChargePercent}%)</span><span>+ {fmt(serviceCharge)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:700,color:"#bf4626",marginTop:5,paddingTop:5,borderTop:"1px solid #ede8de"}}><span>Total</span><span>{fmt(total)}</span></div>
        </div>

        <div style={{padding:"10px 14px",display:"flex",gap:6}}>
          <button onClick={clear} style={{padding:"12px 14px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>sendOrder(false,null)} style={{flex:1,padding:"12px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>Send Order</button>
          <button onClick={()=>sendOrder(true,"cash")} style={{flex:1,padding:"12px",background:"#059669",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>Pay Cash</button>
          <button onClick={()=>sendOrder(true,"card")} style={{flex:1,padding:"12px",background:"#bf4626",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>Pay Card</button>
        </div>
      </div>
    </div>}
  </div>;
}

// MODERN UI - the current existing UI (renamed from PosV)
function PosVModern({menu,onOrder,push,user,branch,tables,setTables,orders,onBackToDash,customers,setCustomers}){
  var [phoneCust,setPhoneCust]=useState(null); // when set, this is a delivery/collection order
  var [showCodePopup,setShowCodePopup]=useState(null); // {code, customer, type, total} when set
  var [showPhonePopup,setShowPhonePopup]=useState(()=>{try{if(window.__posOpenPhonePopup){window.__posOpenPhonePopup=false;return true;}}catch(e){}return false;});
  var cats=[...new Set(menu.filter(i=>i.avail).map(i=>i.cat))];
  var [cat,setCat]=useState(cats[0]),[cart,setCart]=useState([]),[tbl,setTbl]=useState(()=>{
    if(typeof window!=="undefined"&&window.__preselectedTable){
      var v=window.__preselectedTable;
      window.__preselectedTable=null;
      return v;
    }
    return "";
  }),[type,setType]=useState(()=>{try{var t=window.__posInitialType;if(t){window.__posInitialType=null;return t;}}catch(e){}return "dine-in";});
  var [payStep,setPayStep]=useState(null),[cashGiven,setCashGiven]=useState("");
  var [showPayment,setShowPayment]=useState(false);
  var [tip,setTip]=useState(0),[discPct,setDiscPct]=useState(0),[discReason,setDiscReason]=useState("");
  var [splitN,setSplitN]=useState(1);
  var [lastOrder,setLastOrder]=useState(null);
  var [posDeliv,setPosDeliv]=useState(null); // delivery settings for service charge
  useEffect(()=>{
    if(!branch)return;
    dbFetchAllDelivery().then(list=>{
      var s=(list||[]).find(x=>x.branch_id===branch.id);
      if(s){
        setPosDeliv({
          serviceChargeEnabled:s.service_charge_enabled||false,
          serviceChargePercent:parseFloat(s.service_charge_percent||12.5),
          serviceChargeMandatory:s.service_charge_mandatory||false,
        });
      }
    });
  },[branch]);
  var rawSub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  var discAmt=rawSub*(discPct/100);
  var afterDisc=rawSub-discAmt;
  // Service charge: only on dine-in, only if enabled in branch settings
  var posServiceApplies=type==="dine-in"&&posDeliv&&posDeliv.serviceChargeEnabled;
  var serviceCharge=posServiceApplies?afterDisc*((posDeliv.serviceChargePercent||0)/100):0;
  var vat=afterDisc-afterDisc/1.2;
  var total=afterDisc+serviceCharge+tip;
  var perSplit=total/Math.max(splitN,1);
  var count=cart.reduce((s,i)=>s+i.qty,0);
  var [flashId,setFlashId]=useState(null);
  var [showPicker,setShowPicker]=useState(false);
  var cartRef=useRef(null);
  var add=it=>{
    var typePrice=getItemPrice(it,type);
    setCart(c=>{
      var ex=c.find(x=>x.id===it.id);
      if(ex){
        // If item already in cart, increment qty and move to top
        var others=c.filter(x=>x.id!==it.id);
        return [{...ex,qty:ex.qty+1,price:typePrice},...others];
      }
      // New item goes to top
      return [{id:it.id,name:it.name,qty:1,price:typePrice},...c];
    });
    setFlashId(it.id);
    setTimeout(()=>setFlashId(null),600);
    // Auto-scroll cart to top to show newly added item
    setTimeout(()=>{
      if(cartRef.current)cartRef.current.scrollTop=0;
    },50);
    if(typeof window!=="undefined"&&window.navigator&&window.navigator.vibrate){window.navigator.vibrate(15);}
  };
  var dec=id=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0));
  var del=id=>setCart(c=>c.filter(x=>x.id!==id));
  var clear=()=>{setCart([]);setTbl("");setTip(0);setDiscPct(0);setDiscReason("");setSplitN(1);};
  var send=(paid,method,payData)=>{
    if(!cart.length)return;
    // VALIDATION: Dine-in requires table number
    if(type==="dine-in"&&!tbl){
      push({title:"Table required!",body:"Please select a table number for dine-in orders",color:"#dc2626"});
      if(typeof window!=="undefined"&&window.navigator&&window.navigator.vibrate){window.navigator.vibrate([50,50,50]);}
      return;
    }
    var tableId=type==="dine-in"?parseInt(tbl)||null:null;
    // CONFLICT CHECK: If another order exists for this table already, warn
    if(tableId&&orders){
      var existing=orders.filter(o=>o.tableId===tableId&&o.branchId===branch?.id&&!o.paid&&!["delivered","collected","cancelled"].includes(o.status));
      if(existing.length>0){
        var otherOrder=existing[0];
        var msg="Table "+tableId+" already has an active order ("+otherOrder.id+") by "+(otherOrder.takenBy||otherOrder.customer)+" totaling "+fmt(otherOrder.total)+".\n\nOK = Add to existing bill (recommended)\nCancel = Don't send this order";
        if(!window.confirm(msg))return;
      }
    }
    // Build customer & order details - use phone customer if set
    var customer,phoneNum,address,orderType,deliveryCode;
    if(phoneCust){
      // PHONE ORDER - use saved customer details
      customer=phoneCust.name+" ("+phoneCust.phone+")";
      phoneNum=phoneCust.phone;
      // type was set when phone customer was selected - "takeaway" for collection, but for delivery use proper type
      orderType=type==="takeaway"?"collection":(type==="dine-in"?"delivery":type);
      address=orderType==="delivery"?phoneCust.address:null;
      // Auto-generate a 4-digit delivery code so driver verification still works
      deliveryCode=String(Math.floor(1000+Math.random()*9000));
    }else{
      customer=type==="dine-in"?"Table "+(tbl||"?"):"Walk-in "+nowT();
      phoneNum=null;
      address=null;
      orderType=type;
      deliveryCode=null;
    }
    var o={id:uid(),branchId:branch?.id,userId:phoneCust?phoneCust.id:(user?.id||"staff"),customer,phone:phoneNum,items:cart,subtotal:rawSub,discount:discAmt,discReason:discReason,serviceCharge:serviceCharge,tip:payData?payData.tip:tip,total:payData?payData.total:total,status:"preparing",time:nowT(),type:orderType,paid,slot:null,payMethod:method||null,takenBy:user?.name,splitN:splitN,tableId:tableId,source:phoneCust?"phone":"staff",address:address,deliveryCode:deliveryCode,phoneCustomer:phoneCust?true:false,paymentSplit:payData&&payData.method==="split"?{cash:payData.cashPart,card:payData.cardPart}:null};
    onOrder(o);setLastOrder(o);
    var msgBody=phoneCust?(phoneCust.name+" - "+fmt(o.total)+(deliveryCode?" - Code: "+deliveryCode:"")):(o.id+" - "+fmt(o.total));
    push({title:paid?"Paid by "+method:(phoneCust?"Phone order sent":"Sent to kitchen"),body:msgBody,color:paid?"#059669":"#2563eb"});
    // Show big popup with delivery code for phone orders so staff can read to customer
    if(phoneCust&&deliveryCode&&orderType==="delivery"){
      setShowCodePopup({code:deliveryCode,customer:phoneCust.name,phone:phoneCust.phone,type:orderType,total:o.total,address:phoneCust.address});
    }
    // Auto-update table status when dine-in order placed
    if(tableId&&setTables&&tables){
      var targetTable=tables.find(t=>t.id===tableId||t.table_number===tableId);
      if(targetTable){
        setTables(ts=>ts.map(t=>(t.id===tableId||t.table_number===tableId)?{...t,status:"occupied",since:nowT(),guests:t.guests||splitN,orderId:o.id}:t));
        // Save to DB if this table has a dbId
        if(targetTable.dbId||targetTable.id){
          var dbTableId=targetTable.dbId||targetTable.id;
          dbUpdateTableStatus(dbTableId,"occupied",{}).catch(e=>console.log("Table update failed:",e));
        }
      }
    }
    clear();setPayStep(paid?"done":null);setCashGiven("");
    setPhoneCust(null); // clear phone customer after order placed
    // If phone delivery order: don't auto-return - popup will handle it after OK click
    var hasCodePopup=phoneCust&&deliveryCode&&orderType==="delivery";
    // If dashboard mode enabled and just sent (not paid - which has its own success screen), return to dashboard
    // BUT only if no code popup is showing - that needs to stay until staff clicks OK
    if(!paid&&onBackToDash&&!hasCodePopup){
      setTimeout(()=>onBackToDash(),300);
    }
  };
  var change=parseFloat(cashGiven)-total;

  // Payment success with receipt option
  if(payStep==="done"&&lastOrder) return <div style={{minHeight:"100vh",background:"#1a1208",display:"flex",flexDirection:"column",padding:20,justifyContent:"center",alignItems:"center"}}>
    <div style={{fontSize:72,marginBottom:16,color:"#10b981"}}>{EM.check}</div>
    <h2 style={{color:"#fff",fontSize:30,marginBottom:6,fontFamily:"'Playfair Display',serif"}}>Payment Complete</h2>
    <p style={{color:"#d4952a",fontSize:36,fontWeight:700,marginBottom:4}}>{fmt(lastOrder.total)}</p>
    <p style={{color:"#888",fontSize:13,marginBottom:6}}>Paid by {lastOrder.payMethod} - {lastOrder.id}</p>
    {lastOrder.splitN>1&&<p style={{color:"#888",fontSize:12,marginBottom:6}}>Split {lastOrder.splitN} ways - {fmt(lastOrder.total/lastOrder.splitN)} each</p>}
    {lastOrder.tip>0&&<p style={{color:"#888",fontSize:12,marginBottom:30}}>Includes {fmt(lastOrder.tip)} tip</p>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
      <button className="btn btn-o" onClick={()=>printR(lastOrder,branch)} style={{padding:"14px 24px",fontSize:14}}>Print Receipt</button>
      <button className="btn btn-o" onClick={()=>{alert("Email receipt sent (simulated)");}} style={{padding:"14px 24px",fontSize:14}}>Email Receipt</button>
      <button className="btn btn-r" onClick={()=>{setLastOrder(null);setPayStep(null);if(onBackToDash)onBackToDash();}} style={{padding:"14px 24px",fontSize:14}}>{onBackToDash?"Back to Dashboard":"New Order"}</button>
    </div>
  </div>;

  // Cash payment screen
  if(payStep==="cash") return <div style={{minHeight:"100vh",background:"#1a1208",display:"flex",flexDirection:"column",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={()=>setPayStep(null)} style={{color:"#d4952a",fontSize:16,fontWeight:700,border:"none",background:"none",cursor:"pointer"}}>{"< Back"}</button>
      <p style={{color:"#fff",fontSize:22,fontWeight:700}}>Cash Payment</p>
      <div style={{width:60}}/>
    </div>
    <div style={{background:"#2e1f10",borderRadius:14,padding:20,marginBottom:16,textAlign:"center"}}>
      <p style={{color:"#d4952a",fontSize:12,letterSpacing:2,fontWeight:700,marginBottom:6}}>TOTAL DUE</p>
      <p style={{color:"#fff",fontSize:42,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{fmt(total)}</p>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14}}>
      <label className="lbl">Cash Given</label>
      <input type="number" step="0.01" className="field" value={cashGiven} onChange={e=>setCashGiven(e.target.value)} placeholder="0.00" style={{fontSize:26,padding:"14px 16px",textAlign:"right",fontWeight:700}} autoFocus/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
        {[5,10,20,50,100,total].map((v,i)=><button key={i} onClick={()=>setCashGiven(String(v))} style={{padding:"12px 4px",borderRadius:9,background:"#f7f3ee",fontWeight:700,fontSize:14,border:"2px solid #ede8de",cursor:"pointer"}}>{fmt(v)}</button>)}
      </div>
    </div>
    {cashGiven&&<div style={{background:change>=0?"#d1fae5":"#fee2e2",borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
      <p style={{fontSize:11,color:change>=0?"#059669":"#dc2626",fontWeight:700,letterSpacing:2,marginBottom:4}}>{change>=0?"CHANGE DUE":"INSUFFICIENT"}</p>
      <p style={{fontSize:32,fontWeight:700,color:change>=0?"#059669":"#dc2626"}}>{fmt(Math.abs(change))}</p>
    </div>}
    <button className="btn btn-r" disabled={change<0||!cashGiven} onClick={()=>send(true,"Cash")} style={{padding:"18px",fontSize:18,marginTop:"auto"}}>Confirm Cash Payment</button>
  </div>;

  // Card payment screen
  if(payStep==="card") return <div style={{minHeight:"100vh",background:"#1a1208",display:"flex",flexDirection:"column",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={()=>setPayStep(null)} style={{color:"#d4952a",fontSize:16,fontWeight:700,border:"none",background:"none",cursor:"pointer"}}>{"< Back"}</button>
      <p style={{color:"#fff",fontSize:22,fontWeight:700}}>Card Payment</p>
      <div style={{width:60}}/>
    </div>
    <div style={{background:"#2e1f10",borderRadius:14,padding:20,marginBottom:20,textAlign:"center"}}>
      <p style={{color:"#d4952a",fontSize:12,letterSpacing:2,fontWeight:700,marginBottom:6}}>INSERT / TAP CARD</p>
      <p style={{color:"#fff",fontSize:42,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{fmt(total)}</p>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:30,marginBottom:14,textAlign:"center",flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:14}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"#f7f3ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,animation:"pulse 1.5s infinite"}}>"CARD"</div>
      <p style={{fontSize:16,fontWeight:700}}>Waiting for terminal...</p>
      <p style={{fontSize:13,color:"#8a8078"}}>Insert chip, swipe, or tap card</p>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button className="btn btn-o" onClick={()=>setPayStep(null)} style={{flex:1,padding:"14px"}}>Cancel</button>
      <button className="btn btn-r" onClick={()=>send(true,"Card")} style={{flex:2,padding:"14px",fontSize:16}}>Approve Payment</button>
    </div>
  </div>;

  return <div className="pos-wrap">
    {/* PAYMENT FLOW - new cash/card/split popup */}
    {showPayment&&<PaymentFlow total={total} branch={branch} user={user} orderId={null} onCancel={()=>setShowPayment(false)} onComplete={(payData)=>{
      setShowPayment(false);
      // Place the order with payment data
      send(true,payData.method,payData);
    }}/>}
    
    {/* DELIVERY CODE POPUP - big visible popup so staff can read to customer */}
    {showCodePopup&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
      <div style={{background:"linear-gradient(135deg,#1a1208,#3d2e22)",color:"#fff",borderRadius:16,padding:"30px 26px",maxWidth:520,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.6)",border:"4px solid #d4952a"}}>
        <p style={{fontSize:13,color:"#d4952a",fontWeight:700,letterSpacing:3,marginBottom:10}}>{EM.check} ORDER SENT TO KITCHEN</p>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"#fff"}}>{showCodePopup.customer}</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,.75)",marginBottom:14}}>{showCodePopup.phone} - {fmt(showCodePopup.total)}</p>
        
        <div style={{background:"#fff",color:"#1a1208",borderRadius:12,padding:"24px 16px",margin:"14px 0",boxShadow:"inset 0 0 0 3px #d4952a"}}>
          <p style={{fontSize:12,color:"#8a8078",fontWeight:700,letterSpacing:2,marginBottom:8}}>READ THIS CODE TO CUSTOMER</p>
          <p style={{fontSize:72,fontWeight:700,letterSpacing:16,color:"#bf4626",fontFamily:"'Courier New',monospace",lineHeight:1,marginBottom:6}}>{showCodePopup.code}</p>
          <p style={{fontSize:11,color:"#8a8078",marginTop:8}}>Driver will ask for this code on cash delivery</p>
        </div>
        
        <div style={{padding:"14px",background:"rgba(255,255,255,.08)",borderRadius:9,marginBottom:14,textAlign:"left",border:"1px solid rgba(255,255,255,.15)"}}>
          <p style={{fontSize:11,color:"#d4952a",fontWeight:700,letterSpacing:1,marginBottom:5}}>{String.fromCharCode(0xD83D,0xDCDE)} SAY TO CUSTOMER:</p>
          <p style={{fontSize:14,fontStyle:"italic",lineHeight:1.5}}>"Your order has been sent to the kitchen. When the driver arrives for cash payment, please give them this 4-digit code: <span style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Courier New',monospace"}}>{showCodePopup.code.split("").join(" ")}</span>"</p>
        </div>
        
        <p style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:10,fontStyle:"italic"}}>This popup will stay until you click below</p>
        
        <button onClick={()=>{var hadDash=!!onBackToDash;setShowCodePopup(null);if(hadDash)setTimeout(()=>onBackToDash(),100);}} style={{padding:"18px 32px",background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none",borderRadius:11,fontSize:16,fontWeight:700,cursor:"pointer",width:"100%",boxShadow:"0 4px 14px rgba(5,150,105,.4)"}}>{EM.check} I have given the code - Close</button>
      </div>
    </div>}
    
    {showPhonePopup&&<PhoneCustomerPopup customers={customers} setCustomers={setCustomers} push={push} branch={branch} initialPhone="" onClose={()=>setShowPhonePopup(false)} onCustomerReady={(data)=>{setPhoneCust(data.customer);setType(data.orderType);setShowPhonePopup(false);push({title:"Phone customer ready",body:data.customer.name+" - "+data.orderType,color:"#059669"});}}/>}
    
    {/* Phone customer banner (when in phone order mode) */}
    {phoneCust&&<div style={{background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{flex:1,minWidth:200}}>
        <p style={{fontSize:10,fontWeight:700,letterSpacing:2,opacity:.85}}>PHONE ORDER - {(type||"DELIVERY").toUpperCase()}</p>
        <p style={{fontSize:14,fontWeight:700}}>{phoneCust.name} - {phoneCust.phone}</p>
        {phoneCust.address&&<p style={{fontSize:11,opacity:.85}}>{EM.pin} {phoneCust.address.line1}, {phoneCust.address.postcode}{phoneCust.distance>0?" - "+(typeof phoneCust.distance==="number"?phoneCust.distance.toFixed(1):phoneCust.distance)+" mi":""}</p>}
      </div>
      <button onClick={()=>{setPhoneCust(null);setType("dine-in");}} style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:700,background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.3)",cursor:"pointer"}}>Clear & Switch to Walk-in</button>
    </div>}
    
    <div style={{background:"#1a1208",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      {onBackToDash&&<button onClick={onBackToDash} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer"}}>{"< Dashboard"}</button>}
      <p style={{color:"#d4952a",fontWeight:700,fontSize:14}}>POS</p>
      <button onClick={()=>setShowPhonePopup(true)} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:"#2563eb",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{EM.phone} Phone Order</button>
      <div style={{display:"flex",gap:4}}>
        {[["dine-in","Dine In"],["takeaway","Takeaway"]].map(([tp,lb])=><button key={tp} onClick={()=>{setType(tp);setCart(c=>c.map(it=>{var m=menu.find(x=>String(x.id)===String(it.id));var newPrice=m?getItemPrice(m,tp):it.price;return{...it,price:newPrice};}));}} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:type===tp?"#bf4626":"rgba(255,255,255,.1)",color:"#fff",border:"none",cursor:"pointer"}}>{lb}</button>)}
      </div>
      {type==="dine-in"&&<>
        <input value={tbl} onChange={e=>setTbl(e.target.value)} placeholder="Table #" style={{width:70,padding:"5px 8px",border:"none",borderRadius:6,fontSize:13,fontWeight:700,textAlign:"center",background:!tbl?"#fef3c7":"#fff",color:!tbl?"#92400e":"#1a1208"}}/>
        <button onClick={()=>setShowPicker(true)} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",cursor:"pointer"}}>Pick Table</button>
      </>}
      <span style={{color:"#888",fontSize:11,marginLeft:"auto"}}>{user?.name||"Staff"}</span>
    </div>

    <div className="pos-body">
      
      <div className="pos-menu">
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:8}}>
          {cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap",padding:"10px 16px",borderRadius:8,fontWeight:700,fontSize:13,border:"none",background:cat===c?"#1a1208":"#fff",color:cat===c?"#d4952a":"#1a1208",flexShrink:0,cursor:"pointer",boxShadow:cat===c?"0 3px 10px rgba(0,0,0,.2)":"0 1px 3px rgba(0,0,0,.06)"}}>{c}</button>)}
        </div>
        <div className="pos-grid">
          {(()=>{var seen=new Set();return menu.filter(i=>i.cat===cat&&i.avail&&isItemAvailable(i,type)).filter(i=>{var key=(i.name||"").toLowerCase().trim()+"|"+(i.cat||"");if(seen.has(key))return false;seen.add(key);return true;}).map(item=>{
            var inCart=cart.find(c=>c.id===item.id);
            var displayPrice=getItemPrice(item,type);
            return <button key={item.dbId||item.id} onClick={()=>add(item)} disabled={item.stock===0} style={{background:inCart?"#fff5f3":"#fff",border:"2px solid "+(inCart?"#bf4626":"transparent"),borderRadius:10,padding:10,cursor:item.stock===0?"not-allowed":"pointer",opacity:item.stock===0?.4:1,boxShadow:inCart?"0 4px 16px rgba(191,70,38,.25)":"0 2px 8px rgba(0,0,0,.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:5,minHeight:115,transition:"all .15s",position:"relative"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.93)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} onTouchStart={e=>e.currentTarget.style.transform="scale(.93)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              {inCart&&<div style={{position:"absolute",top:-6,right:-6,background:"#bf4626",color:"#fff",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(191,70,38,.5)",border:"2px solid #fff"}}>{inCart.qty}</div>}
              <span style={{fontSize:28}}>{EM[item.icon]||""}</span>
              <p style={{fontSize:11,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{item.name}</p>
              <p style={{fontSize:13,fontWeight:700,color:"#bf4626"}}>{fmt(displayPrice)}</p>
            </button>;
          });})()}
        </div>
      </div>

      
      <div className="pos-cart">
        <div style={{padding:"12px 14px",borderBottom:"1px solid #ede8de",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontWeight:700,fontSize:14}}>{type==="dine-in"?"Table "+(tbl||"?"):"Takeaway"}</p>
            <p style={{fontSize:11,color:"#8a8078"}}>{count} item{count!==1?"s":""}</p>
          </div>
          {cart.length>0&&<button onClick={clear} style={{color:"#dc2626",fontSize:12,fontWeight:700,border:"none",background:"none",cursor:"pointer"}}>Clear</button>}
        </div>
        <div className="pos-cart-items" ref={cartRef}>
          {cart.length===0&&<p style={{textAlign:"center",color:"#8a8078",padding:20,fontSize:13}}>Tap menu items to add</p>}
          {cart.map(it=><div key={it.id} className={flashId===it.id?"flash":""} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #f7f3ee"}}>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:13}}>{it.name}</p>
              <p style={{fontSize:11,color:"#8a8078"}}>{fmt(it.price)} each</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#f7f3ee",borderRadius:50,padding:"3px 10px"}}>
              <button onClick={()=>dec(it.id)} style={{fontSize:18,color:"#bf4626",fontWeight:700,border:"none",background:"none",cursor:"pointer",width:20}}>-</button>
              <span style={{fontWeight:700,minWidth:18,textAlign:"center",fontSize:14}}>{it.qty}</span>
              <button onClick={()=>add(it)} style={{fontSize:18,color:"#bf4626",fontWeight:700,border:"none",background:"none",cursor:"pointer",width:20}}>+</button>
            </div>
            <p style={{fontWeight:700,minWidth:55,textAlign:"right",fontSize:13,color:"#bf4626"}}>{fmt(it.price*it.qty)}</p>
            <button onClick={()=>del(it.id)} style={{color:"#ccc",fontSize:16,border:"none",background:"none",cursor:"pointer"}}>x</button>
          </div>)}
        </div>
        <div className="pos-cart-footer">
          {/* Tip selector */}
          {cart.length>0&&<div style={{marginBottom:8}}>
            <p style={{fontSize:10,fontWeight:700,color:"#8a8078",letterSpacing:1,marginBottom:4}}>TIP</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
              {[0,0.05,0.10,0.125,0.15].map(p=><button key={p} onClick={()=>setTip(rawSub*p)} style={{padding:"7px 2px",borderRadius:6,fontSize:11,fontWeight:700,background:Math.abs(tip-rawSub*p)<0.01?"#d4952a":"#fff",color:Math.abs(tip-rawSub*p)<0.01?"#fff":"#1a1208",border:"2px solid "+(Math.abs(tip-rawSub*p)<0.01?"#d4952a":"#ede8de"),cursor:"pointer"}}>{p===0?"None":(p*100)+"%"}</button>)}
            </div>
          </div>}

          {/* Discount selector */}
          {cart.length>0&&<div style={{marginBottom:8}}>
            <p style={{fontSize:10,fontWeight:700,color:"#8a8078",letterSpacing:1,marginBottom:4}}>DISCOUNT</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
              {[[0,"None"],[10,"10%"],[20,"20%"],[50,"50%"]].map(([p,lb])=><button key={p} onClick={()=>setDiscPct(p)} style={{padding:"7px 2px",borderRadius:6,fontSize:11,fontWeight:700,background:discPct===p?"#dc2626":"#fff",color:discPct===p?"#fff":"#1a1208",border:"2px solid "+(discPct===p?"#dc2626":"#ede8de"),cursor:"pointer"}}>{lb}</button>)}
            </div>
            {discPct>0&&<input value={discReason} onChange={e=>setDiscReason(e.target.value)} placeholder="Reason (staff, loyalty, complaint...)" style={{width:"100%",padding:"6px 8px",border:"1px solid #ede8de",borderRadius:6,fontSize:11,marginTop:4}}/>}
          </div>}

          {/* Split bill */}
          {cart.length>0&&<div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <p style={{fontSize:10,fontWeight:700,color:"#8a8078",letterSpacing:1}}>SPLIT BILL</p>
              {splitN>1&&<button onClick={()=>setSplitN(1)} style={{fontSize:10,color:"#dc2626",border:"none",background:"none",cursor:"pointer",fontWeight:700}}>Reset</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
              {[1,2,3,4,5,6].map(n=><button key={n} onClick={()=>setSplitN(n)} style={{padding:"7px 2px",borderRadius:6,fontSize:11,fontWeight:700,background:splitN===n?"#7c3aed":"#fff",color:splitN===n?"#fff":"#1a1208",border:"2px solid "+(splitN===n?"#7c3aed":"#ede8de"),cursor:"pointer"}}>{n===1?"No":n+"x"}</button>)}
            </div>
          </div>}

          {/* Totals */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8a8078",marginBottom:2}}><span>Subtotal</span><span>{fmt(rawSub)}</span></div>
          {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#dc2626",marginBottom:2,fontWeight:700}}><span>Discount ({discPct}%)</span><span>- {fmt(discAmt)}</span></div>}
          {posServiceApplies&&serviceCharge>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7c3aed",marginBottom:2,fontWeight:700}}><span>Service ({posDeliv.serviceChargePercent}%)</span><span>+ {fmt(serviceCharge)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a8078",marginBottom:2}}><span>VAT incl. 20%</span><span>{fmt(vat)}</span></div>
          {tip>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#d4952a",marginBottom:2,fontWeight:700}}><span>Tip</span><span>+ {fmt(tip)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:18,marginBottom:6,paddingTop:6,borderTop:"1px solid #ede8de"}}><span>TOTAL</span><span style={{color:"#bf4626"}}>{fmt(total)}</span></div>
          {splitN>1&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#7c3aed",marginBottom:8,fontWeight:700,background:"#f5f3ff",padding:"6px 10px",borderRadius:7}}><span>Per person ({splitN})</span><span>{fmt(perSplit)}</span></div>}

          {type==="dine-in"&&!tbl&&cart.length>0&&<div style={{padding:"10px 12px",background:"#fee2e2",borderRadius:7,marginBottom:8,fontSize:12,color:"#991b1b",fontWeight:700,textAlign:"center",border:"2px solid #fca5a5"}}>
            {EM.cross} Select a table number to continue
          </div>}
          {type==="dine-in"&&tbl&&orders&&(()=>{
            var tableIdNum=parseInt(tbl);
            var existing=orders.filter(o=>o.tableId===tableIdNum&&o.branchId===branch?.id&&!o.paid&&!["delivered","collected","cancelled"].includes(o.status));
            if(existing.length===0)return null;
            return <div style={{padding:"10px 12px",background:"#fef3c7",borderRadius:7,marginBottom:8,fontSize:11,color:"#92400e",border:"2px solid #fde68a"}}>
              <strong>{EM.star} Table {tbl} already has {existing.length} active order{existing.length!==1?"s":""}</strong>
              <br/>By {existing[0].takenBy||existing[0].customer||"another staff"} - {fmt(existing.reduce((s,o)=>s+o.total,0))}
              <br/>Your new items will be added to the same bill.
            </div>;
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
            <button className="btn btn-d" disabled={!cart.length||(type==="dine-in"&&!tbl)} onClick={()=>setShowPayment(true)} style={{padding:"14px",fontSize:14,background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",border:"none"}}>{String.fromCharCode(0xD83D,0xDCB5)} Cash</button>
            <button className="btn btn-p" disabled={!cart.length||(type==="dine-in"&&!tbl)} onClick={()=>setShowPayment(true)} style={{padding:"14px",fontSize:14,background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",border:"none"}}>{String.fromCharCode(0xD83D,0xDCB3)} Card</button>
            <button disabled={!cart.length||(type==="dine-in"&&!tbl)} onClick={()=>setShowPayment(true)} style={{padding:"14px",fontSize:14,background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,opacity:!cart.length||(type==="dine-in"&&!tbl)?.5:1}}>Split</button>
          </div>
          <button className="btn btn-o" disabled={!cart.length||(type==="dine-in"&&!tbl)} onClick={()=>send(false,null)} style={{width:"100%",padding:"10px",fontSize:13}}>Send to kitchen (pay later)</button>
        </div>
      </div>
    </div>

    {showPicker&&(()=>{
      var branchTables=tables?tables.filter(t=>!t.branchId||t.branchId===branch?.id).sort((a,b)=>(+a.id)-(+b.id)):[];
      var statusColor={free:"#10b981",occupied:"#dc2626",reserved:"#d4952a"};
      var statusBg={free:"#d1fae5",occupied:"#fee2e2",reserved:"#fef3c7"};
      return <div onClick={()=>setShowPicker(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:520,padding:22,maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <h2 style={{fontSize:20,marginBottom:2}}>Pick a Table</h2>
              <p style={{fontSize:12,color:"#8a8078"}}>{branch?.name} - {branchTables.length} tables</p>
            </div>
            <button onClick={()=>setShowPicker(false)} style={{color:"#999",fontSize:22,border:"none",background:"none",cursor:"pointer"}}>x</button>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14,fontSize:11}}>
            {[["Free","#10b981"],["Occupied","#dc2626"],["Reserved","#d4952a"]].map(([l,c])=><div key={l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:"50%",background:c,display:"inline-block"}}/><span style={{color:"#8a8078"}}>{l}</span></div>)}
          </div>
          {branchTables.length===0?<div style={{textAlign:"center",padding:30}}>
            <p style={{fontSize:40,marginBottom:10}}>{EM.cart}</p>
            <p style={{fontSize:14,color:"#8a8078"}}>No tables yet. Add tables in Admin panel.</p>
          </div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(85px,1fr))",gap:8}}>
            {branchTables.map(t=>{
              var c=statusColor[t.status]||statusColor.free;
              var bg=statusBg[t.status]||statusBg.free;
              var selected=String(tbl)===String(t.id);
              return <button key={(t.dbId||t.id)+"_"+t.id} onClick={()=>{
                if(t.status==="occupied"){
                  if(!window.confirm("Table "+t.id+" is occupied. Add another order to this table?"))return;
                }
                setTbl(String(t.id));
                setShowPicker(false);
                if(typeof window!=="undefined"&&window.navigator&&window.navigator.vibrate){window.navigator.vibrate(10);}
              }} style={{
                padding:"14px 6px",
                background:selected?"#bf4626":bg,
                color:selected?"#fff":c,
                border:"3px solid "+(selected?"#bf4626":c),
                borderRadius:10,
                cursor:"pointer",
                fontWeight:700,
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                gap:2,
                transition:"all .15s",
              }}>
                <span style={{fontSize:18}}>T{t.id}</span>
                <span style={{fontSize:10,fontWeight:600}}>{t.seats} seats</span>
                {t.status==="occupied"&&t.guests&&<span style={{fontSize:9,fontWeight:700}}>{t.guests} in</span>}
              </button>;
            })}
          </div>}
          <div style={{marginTop:14,display:"flex",gap:7}}>
            <button className="btn btn-o" onClick={()=>setShowPicker(false)} style={{flex:1,padding:"11px"}}>Cancel</button>
          </div>
        </div>
      </div>;
    })()}
  </div>;
}


export default function App(){
  var [view,setView]=useState("menu"),[orders,setOrders]=useState([]),[menu,setMenu]=useState([]);
  var [discs,setDiscs]=useState([]),[users,setUsers]=useState(USERS);
  var [reviews,setReviews]=useState([]);
  var [reservations,setRes]=useState([]);
  var [messages,setMessages]=useState([]);
  var [tables,setTables]=useState([]);
  var [setMeals,setSetMeals]=useState([]);
  var [categories,setCategories]=useState([]);
  var [customers,setCustomers]=useState([]);
  var [stations,setStations]=useState([]);
  // Restore user and branch from localStorage so refresh doesn't log out
  var [user,setUser]=useState(()=>{try{var u=localStorage.getItem("latavola_user");return u?JSON.parse(u):null;}catch(e){return null;}});
  var [branch,setBranch]=useState(()=>{try{var b=localStorage.getItem("latavola_branch");return b?JSON.parse(b):null;}catch(e){return null;}});
  var [showAuth,setAuth]=useState(false),[notifs,setNotifs]=useState([]);
  var [online,setOnline]=useState(isOnline()),[pendingCount,setPendingCount]=useState(getQueue().length);
  var nid=useRef(0);

  // Persist user session so refresh doesn't log out
  useEffect(()=>{
    try{
      if(user)localStorage.setItem("latavola_user",JSON.stringify(user));
      else localStorage.removeItem("latavola_user");
    }catch(e){}
  },[user]);

  useEffect(()=>{
    try{
      if(branch)localStorage.setItem("latavola_branch",JSON.stringify(branch));
      else localStorage.removeItem("latavola_branch");
    }catch(e){}
  },[branch]);

  // Auto-detect branch from QR code URL (customer scans QR at table)
  useEffect(()=>{
    if(typeof window==="undefined")return;
    var params=new URLSearchParams(window.location.search);
    var qrBranch=params.get("branch");
    if(qrBranch&&!branch){
      var b=BRANCHES.find(x=>x.id===qrBranch);
      if(b)setBranch(b);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Load data from Supabase on app start
  useEffect(()=>{
    // Load orders from the database
    fetchOrders().then(dbOrders=>{
      if(dbOrders&&dbOrders.length){
        var formatted=dbOrders.map(o=>({
          id:o.order_number,
          branchId:o.branch_id,
          userId:o.customer_id,
          customer:o.customer_name||"Guest",
          phone:o.customer_phone,
          items:o.items||[],
          subtotal:parseFloat(o.subtotal||0),
          deliveryFee:parseFloat(o.delivery_fee||0),
          total:parseFloat(o.total||0),
          status:o.status,
          type:o.type,
          paid:o.paid,
          payMethod:o.pay_method,
          address:o.address,
          slot:o.slot,
          takenBy:o.taken_by,
          source:o.source,
          tableId:o.table_id,stationProgress:o.station_progress||{},deliveryCode:o.delivery_code,codeMethod:o.code_method,deliveredAt:o.delivered_at,deliveredBy:o.delivered_by,cashCollected:o.cash_collected?parseFloat(o.cash_collected):null,cashHandoverId:o.cash_handover_id,serviceCharge:parseFloat(o.service_charge||0),discount:parseFloat(o.discount||0),
          created_at:o.created_at,
          time:new Date(o.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),
        }));
        setOrders(formatted);
      }
    }).catch(e=>console.log("Orders load failed (using demo data):",e));

    // Load menu items from the database
    dbFetchMenu().then(dbMenu=>{
      if(dbMenu&&dbMenu.length){
        var formatted=dbMenu.map(m=>({
          id:m.id,
          dbId:m.id,
          name:m.name,
          desc:m.description||"",
          price:parseFloat(m.price),
          cat:m.category_name||"Mains",
          icon:m.icon,
          stock:m.stock,
          avail:m.available,
          allergens:m.allergens||[],
          sizes:m.sizes||[],
          extras:m.extras||[],
          cookingOpts:m.cooking_opts||[],
          station:m.station||null,
          priceDineIn:m.price_dinein?parseFloat(m.price_dinein):null,
          priceTakeaway:m.price_takeaway?parseFloat(m.price_takeaway):null,
          priceDelivery:m.price_delivery?parseFloat(m.price_delivery):null,
          availDineIn:m.avail_dinein!==false,
          availTakeaway:m.avail_takeaway!==false,
          availDelivery:m.avail_delivery!==false,
        }));
        setMenu(formatted);
      }
    }).catch(e=>console.log("Menu load failed:",e));

    // Load categories from the database
    dbFetchCategories().then(dbCats=>{
      if(dbCats&&dbCats.length){
        var formatted=dbCats.map(c=>({
          id:c.id,
          dbId:c.id,
          name:c.name,
          icon:c.icon,
          order:c.display_order,
        }));
        setCategories(formatted);
      }
    }).catch(e=>console.log("Categories load failed:",e));

    // Load set meals from the database
    dbFetchSetMeals().then(dbMeals=>{
      if(dbMeals&&dbMeals.length){
        var formatted=dbMeals.map(m=>({
          id:m.id,
          dbId:m.id,
          name:m.name,
          desc:m.description||"",
          price:parseFloat(m.price),
          itemIds:m.item_ids||[],
          icon:m.icon,
          avail:m.available,
        }));
        setSetMeals(formatted);
      }
    }).catch(e=>console.log("Set meals load failed:",e));

    // Load customers from the database (for phone order lookups)
    dbFetchCustomers().then(dbCust=>{
      if(dbCust&&dbCust.length){
        var formatted=dbCust.map(c=>({
          id:c.id,
          dbId:c.id,
          phone:c.phone,
          name:c.name,
          email:c.email,
          address:c.address?(typeof c.address==="string"?{line1:c.address,postcode:""}:c.address):{line1:"",postcode:""},
          distance:c.distance?parseFloat(c.distance):0,
          totalOrders:c.total_orders||0,
          totalSpent:parseFloat(c.total_spent||0),
          notes:c.notes||"",
        }));
        setCustomers(formatted);
      }
    }).catch(e=>console.log("Customers load failed:",e));

    // Load reviews from the database
    dbFetchReviews().then(dbReviews=>{
      if(dbReviews&&dbReviews.length){
        var formatted=dbReviews.map(r=>({
          id:r.id,
          name:r.customer_name,
          rating:r.rating,
          comment:r.comment,
          date:new Date(r.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}),
          helpful:0,
        }));
        setReviews(formatted);
      }
    }).catch(e=>console.log("Reviews load failed:",e));

    // Load tables from the database (for all branches - filter per branch in TablesV)
    dbFetchTables().then(dbTables=>{
      if(dbTables&&dbTables.length){
        var formatted=dbTables.map(t=>({
          id:t.table_number||t.id,
          dbId:t.id,
          branchId:t.branch_id,
          seats:t.seats,
          x:t.x_pos,
          y:t.y_pos,
          status:t.status||"free",
        }));
        setTables(formatted);
      }
    }).catch(e=>console.log("Tables load failed:",e));

    // Load kitchen stations
    dbFetchStations().then(list=>{
      if(list&&list.length){
        setStations(list.map(s=>({
          dbId:s.id,name:s.name,icon:s.icon,color:s.color,
          sortOrder:s.sort_order,active:s.active,
          printerMethod:s.printer_method||"none",
          printerFormat:s.printer_format||"thermal",
          printContent:s.print_content||"station_only",
          autoPrint:s.auto_print||false,
          printnodeId:s.printnode_id||null,
          copies:s.copies||1,
        })));
      }
    }).catch(e=>console.log("Stations load failed:",e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Auto-refresh orders every 15 seconds (so customers see status updates and staff sees new orders)
  useEffect(()=>{
    var interval=setInterval(()=>{
      fetchOrders().then(dbOrders=>{
        if(dbOrders&&dbOrders.length){
          var formatted=dbOrders.map(o=>({
            id:o.order_number,branchId:o.branch_id,userId:o.customer_id,
            customer:o.customer_name||"Guest",phone:o.customer_phone,
            items:o.items||[],subtotal:parseFloat(o.subtotal||0),
            deliveryFee:parseFloat(o.delivery_fee||0),total:parseFloat(o.total||0),
            status:o.status,type:o.type,paid:o.paid,payMethod:o.pay_method,
            address:o.address,slot:o.slot,takenBy:o.taken_by,source:o.source,
            tableId:o.table_id,stationProgress:o.station_progress||{},deliveryCode:o.delivery_code,codeMethod:o.code_method,deliveredAt:o.delivered_at,deliveredBy:o.delivered_by,cashCollected:o.cash_collected?parseFloat(o.cash_collected):null,cashHandoverId:o.cash_handover_id,serviceCharge:parseFloat(o.service_charge||0),discount:parseFloat(o.discount||0),
            created_at:o.created_at,
            time:new Date(o.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),
          }));
          setOrders(formatted);
        }
      }).catch(e=>console.log("Order auto-refresh failed:",e));
    },15000);
    return()=>clearInterval(interval);
  },[]);

  // Monitor network status
  useEffect(()=>{
    var goOnline=()=>{setOnline(true);syncQueue();};
    var goOffline=()=>setOnline(false);
    if(typeof window!=="undefined"){
      window.addEventListener("online",goOnline);
      window.addEventListener("offline",goOffline);
      return()=>{window.removeEventListener("online",goOnline);window.removeEventListener("offline",goOffline);};
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Sync queued orders when back online
  var syncQueue=useCallback(()=>{
    var q=getQueue();
    if(!q.length)return;
    setOrders(os=>[...q,...os]);
    clearQueue();
    setPendingCount(0);
    setNotifs(ns=>[...ns.slice(-3),{id:++nid.current,title:"Synced!",body:q.length+" offline order"+(q.length>1?"s":"")+" uploaded",color:"#059669"}]);
  },[]);
  useEffect(()=>{var s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);
  var push=useCallback(n=>{var id=++nid.current;setNotifs(ns=>[...ns.slice(-3),{...n,id}]);setTimeout(()=>setNotifs(ns=>ns.filter(x=>x.id!==id)),5000);},[]);
  var addOrder=o=>{
    if(!online){
      var count=queueOffline(o);
      setPendingCount(count);
      push({title:"Saved offline",body:"Will sync when online ("+count+" pending)",color:"#d97706"});
      setOrders(os=>[{...o,offline:true},...os]);
    }else{
      setOrders(os=>[o,...os]);
      // Save to Supabase database
      saveOrderToDb(o).then(result=>{
        if(result.error){
          console.log("DB save failed, but order is in memory:",result.error);
        }else{
          console.log("Order saved to database:",o.id);
          // Award loyalty points if user has account (10 points per pound spent)
          if(o.userId&&o.userId!=="guest"&&o.userId!=="staff"&&o.paid){
            var pts=Math.floor((o.subtotal||o.total||0)*10);
            if(pts>0){
              dbAwardPoints(o.userId,pts,o.id,"Order rewards").then(r=>{
                if(r&&r.points){
                  push({title:"Loyalty rewards!",body:"+"+pts+" points - now "+r.points+" total",color:"#d4952a"});
                }
              }).catch(e=>console.log("Loyalty award failed:",e));
            }
          }
        }
      }).catch(e=>console.log("DB error:",e));
    }
    setMenu(ms=>ms.map(m=>{var f=o.items.find(i=>i.id===m.id);if(!f)return m;var ns=Math.max(0,m.stock-f.qty);if(ns===0)push({title:"Out of stock!",body:m.name,color:"#dc2626"});else if(ns<=5)push({title:"Low stock",body:m.name+" - "+ns+" left",color:"#d97706"});return{...m,stock:ns};}));
    if(o.discCode)setDiscs(ds=>ds.map(d=>d.code===o.discCode?{...d,uses:d.uses+1}:d));
  };
  useEffect(()=>{if(user?.role==="kitchen")setView("kitchen");else if(user?.role==="owner"||user?.role==="manager"||user?.role==="waiter")setView("pos");},[user]);
  var isStaff=user&&user.role!=="customer";
  var tabs=isStaff?["pos","phone","tables","bookings","incoming","driver","kitchen","admin","report","chat","account"]:["menu","track","book","reviews","account","chat"];
  var tl={menu:"Order",track:"Track",book:"Book",reviews:"Reviews",account:"Me",chat:"Chat",kitchen:"Kitchen",admin:"Admin",report:"Reports",pos:"POS",tables:"Tables",phone:"Phone",bookings:"Bookings",incoming:"Incoming",driver:"Driver"};
  var ti={menu:"cart",track:"pin",book:"cal",reviews:"star",account:"person",chat:"chat",kitchen:"cook",admin:"gear",report:"chart",pos:"cart",tables:"pin",phone:"phone",bookings:"cal",incoming:"bag",driver:"pin"};

  if(!branch) return <>
    <style>{CSS}</style>
    <div style={{minHeight:"100vh",background:"#f7f3ee"}}>
      <div style={{background:"#1a1208",height:56,display:"flex",alignItems:"center",padding:"0 16px",justifyContent:"space-between"}}>
        <span className="nlogo">La Tavola</span>
        {!user?<button onClick={()=>setAuth(true)} style={{border:"1px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:7,padding:"5px 11px",fontSize:11,fontWeight:600,background:"none",cursor:"pointer"}}>Sign in</button>:<div style={{display:"flex",alignItems:"center",gap:7}}><div className="av">{user.avatar}</div><button onClick={()=>setUser(null)} style={{color:"#888",fontSize:11,border:"none",background:"none",cursor:"pointer"}}>Out</button></div>}
      </div>
      {showAuth&&<Auth onLogin={u=>setUser(u)} onClose={()=>setAuth(false)} users={users} setUsers={setUsers}/>}
      <BranchSel onSelect={setBranch}/>
    </div>
  </>;

  return <div style={{minHeight:"100vh",background:"#f7f3ee"}}>
    <nav className="nav">
      <span className="nlogo">La Tavola</span>
      <button onClick={()=>{if(window.confirm("Change branch? Your cart will be cleared."))setBranch(null);}} title="Click to change branch" style={{background:"rgba(212,149,42,.15)",color:"#d4952a",borderRadius:7,padding:"4px 11px",fontSize:11,fontWeight:700,border:"1px solid rgba(212,149,42,.3)",flexShrink:0,whiteSpace:"nowrap",cursor:"pointer"}}>{EM.pin} {branch.name} {String.fromCharCode(0x25BC)}</button>
      <div className="ntabs">{tabs.map(k=><button key={k} className={"ntab"+(view===k?" on":"")} onClick={()=>setView(k)}>{tl[k]||k}</button>)}</div>
      <div className="nright">
        {notifs.length>0&&<span style={{background:"#bf4626",color:"#fff",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{notifs.length}</span>}
        {user?<><div className="av">{user.avatar}</div><button onClick={()=>{setUser(null);setView("menu");}} style={{color:"#888",fontSize:11,border:"none",background:"none",cursor:"pointer"}}>Out</button></>:<button onClick={()=>setAuth(true)} style={{border:"1px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,background:"none",cursor:"pointer"}}>Sign in</button>}
      </div>
    </nav>
    <div className="mnav">
      {tabs.map(k=><button key={k} className={"mbtn"+(view===k?" on":"")} onClick={()=>setView(k)}>
        <span className="mico">{EM[ti[k]]||""}</span>
        <span>{tl[k]||k}</span>
      </button>)}
    </div>
    <Toasts list={notifs} dismiss={id=>setNotifs(ns=>ns.filter(n=>n.id!==id))}/>
    {!online&&<div style={{background:"#dc2626",color:"#fff",padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:700,position:"sticky",top:58,zIndex:450}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"#fff",display:"inline-block",animation:"pulse 1s infinite"}}/>
      OFFLINE MODE - Orders saved locally{pendingCount>0?" ("+pendingCount+" pending sync)":""}
    </div>}
    {online&&pendingCount>0&&<div style={{background:"#059669",color:"#fff",padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:700}}>
      Back online - syncing {pendingCount} order{pendingCount>1?"s":""}...
    </div>}
    {showAuth&&<Auth onLogin={u=>setUser(u)} onClose={()=>setAuth(false)} users={users} setUsers={setUsers}/>}
    <main style={{paddingBottom:20}}>
      {view==="menu"    &&<MenuV    menu={menu} user={user} branch={branch} onOrder={addOrder} push={push} discounts={discs}/>}
      {view==="pos"     &&<PosV     menu={menu} onOrder={addOrder} push={push} user={user} branch={branch} tables={tables} setTables={setTables} orders={orders} setOrders={setOrders} stations={stations} setView={setView} customers={customers} setCustomers={setCustomers} setUser={setUser}/>}
      {view==="phone"   &&<PhoneOrderV customers={customers} setCustomers={setCustomers} menu={menu} onOrder={addOrder} push={push} user={user} branch={branch} orders={orders}/>}
      {view==="tables"  &&<TablesV  tables={tables} setTables={setTables} push={push} branch={branch} orders={orders} setOrders={setOrders} onGoToPos={tableId=>{
        // Store preselected table so POS can pick it up
        window.__preselectedTable=String(tableId);
        setView("pos");
        push({title:"Adding to Table "+tableId,body:"Add items and send to kitchen",color:"#2563eb"});
      }}/>}
      {view==="bookings"&&<StaffBookingsV branch={branch} push={push}/>}
      {view==="incoming"&&<IncomingOrdersV orders={orders} setOrders={setOrders} push={push} branch={branch} customers={customers} tables={tables} setTables={setTables} stations={stations} menu={menu}/>}
      {view==="driver"&&<DriverV orders={orders} setOrders={setOrders} push={push} user={user} branch={branch}/>}
      {view==="track"   &&<TrackV   orders={orders} branches={BRANCHES} user={user}/>}
      {view==="book"    &&<BookV    reservations={reservations} setReservations={setRes} user={user} onAuth={()=>setAuth(true)} branches={BRANCHES} push={push}/>}
      {view==="reviews" &&<ReviewsV reviews={reviews} setReviews={setReviews} user={user} onAuth={()=>setAuth(true)}/>}
      {view==="account" &&<AccountV user={user} orders={orders} reviews={reviews} reservations={reservations} onAuth={()=>setAuth(true)} branches={BRANCHES}/>}
      {view==="chat"    &&<ChatV    messages={messages} setMessages={setMessages} user={user} onAuth={()=>setAuth(true)}/>}
      {view==="kitchen" &&<KitchenV orders={orders} setOrders={setOrders} push={push} stations={stations} menu={menu}/>}
      {view==="admin"   &&<AdminV   orders={orders} setOrders={setOrders} menu={menu} setMenu={setMenu} discounts={discs} setDiscounts={setDiscs} push={push} branches={BRANCHES} setMeals={setMeals} setSetMeals={setSetMeals} categories={categories} setCategories={setCategories} tables={tables} setTables={setTables} branch={branch} stations={stations} setStations={setStations} user={user}/>}
      {view==="report"  &&<ReportV  orders={orders}/>}
    </main>
  </div>;
}
