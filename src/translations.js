// ============================================================
// MULTI-LANGUAGE TRANSLATIONS
// ============================================================
// 7 languages: English, Bengali, Hindi, Polish, Spanish, Arabic, Italian
// Add new languages here. Each must have ALL keys.
// ============================================================

export const LANGUAGES = {
  en: { name: "English", native: "English", flag: "🇬🇧", dir: "ltr" },
  bn: { name: "Bengali", native: "বাংলা", flag: "🇧🇩", dir: "ltr" },
  hi: { name: "Hindi", native: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  pl: { name: "Polish", native: "Polski", flag: "🇵🇱", dir: "ltr" },
  es: { name: "Spanish", native: "Español", flag: "🇪🇸", dir: "ltr" },
  ar: { name: "Arabic", native: "العربية", flag: "🇸🇦", dir: "rtl" },
  it: { name: "Italian", native: "Italiano", flag: "🇮🇹", dir: "ltr" },
};

export const TRANSLATIONS = {
  en: {
    // Navigation
    order: "Order", track: "Track", book: "Book", reviews: "Reviews", account: "Me", chat: "Chat",
    // Menu / Cart
    menu: "Menu", cart: "Cart", addToCart: "Add to Cart", viewCart: "View Cart", emptyCart: "Your cart is empty", browseMenu: "Browse our menu",
    quantity: "Quantity", remove: "Remove", subtotal: "Subtotal", total: "Total", continue: "Continue", back: "Back",
    // Checkout
    checkout: "Checkout", delivery: "Delivery", collection: "Collection", eatIn: "Eat In", takeaway: "Takeaway",
    yourDetails: "Your Details", name: "Name", phone: "Phone", email: "Email", address: "Address", postcode: "Postcode",
    deliveryNotes: "Delivery notes (optional)", placeOrder: "Place Order", payNow: "Pay Now", payOnDelivery: "Cash on Delivery",
    payOnCollection: "Pay on Collection",
    // Order status
    orderConfirmed: "Order Confirmed!", thankYou: "Thank you", orderNumber: "Order Number", estimatedTime: "Estimated Time",
    deliveryCode: "Delivery Code", showToDriver: "Show this to driver on arrival", paid: "Paid Online", orderAgain: "Order Again", receipt: "Receipt",
    // Booking
    bookTable: "Book a Table", date: "Date", time: "Time", guests: "Guests", specialRequests: "Special Requests",
    confirmReservation: "Confirm Reservation", bookingConfirmed: "Booking Confirmed!",
    // Common
    save: "Save", cancel: "Cancel", close: "Close", confirm: "Confirm", loading: "Loading...", search: "Search",
    yes: "Yes", no: "No", required: "Required", optional: "Optional",
    // Errors
    fieldRequired: "This field is required", invalidEmail: "Invalid email", invalidPhone: "Invalid phone",
    // Status
    pending: "Pending", preparing: "Preparing", ready: "Ready", delivered: "Delivered", cancelled: "Cancelled",
    // Restaurant
    open: "Open", closed: "Closed", openHours: "Opening Hours", today: "Today",
    // Empty states
    noItems: "No items found", noOrders: "No orders yet", noReviews: "No reviews yet",
  },
  bn: {
    order: "অর্ডার", track: "ট্র্যাক", book: "বুকিং", reviews: "রিভিউ", account: "আমি", chat: "চ্যাট",
    menu: "মেনু", cart: "কার্ট", addToCart: "কার্টে যোগ করুন", viewCart: "কার্ট দেখুন", emptyCart: "আপনার কার্ট খালি", browseMenu: "মেনু দেখুন",
    quantity: "পরিমাণ", remove: "সরান", subtotal: "উপ-মোট", total: "মোট", continue: "চালিয়ে যান", back: "পিছনে",
    checkout: "চেকআউট", delivery: "ডেলিভারি", collection: "সংগ্রহ", eatIn: "এখানে খাওয়া", takeaway: "টেকঅ্যাওয়ে",
    yourDetails: "আপনার বিবরণ", name: "নাম", phone: "ফোন", email: "ইমেইল", address: "ঠিকানা", postcode: "পোস্টকোড",
    deliveryNotes: "ডেলিভারি নোট (ঐচ্ছিক)", placeOrder: "অর্ডার করুন", payNow: "এখন পরিশোধ করুন", payOnDelivery: "ডেলিভারিতে নগদ",
    payOnCollection: "সংগ্রহের সময় পরিশোধ",
    orderConfirmed: "অর্ডার নিশ্চিত!", thankYou: "ধন্যবাদ", orderNumber: "অর্ডার নম্বর", estimatedTime: "আনুমানিক সময়",
    deliveryCode: "ডেলিভারি কোড", showToDriver: "ড্রাইভারকে দেখান", paid: "অনলাইনে পরিশোধিত", orderAgain: "আবার অর্ডার", receipt: "রসিদ",
    bookTable: "টেবিল বুকিং", date: "তারিখ", time: "সময়", guests: "অতিথি সংখ্যা", specialRequests: "বিশেষ অনুরোধ",
    confirmReservation: "বুকিং নিশ্চিত করুন", bookingConfirmed: "বুকিং নিশ্চিত!",
    save: "সেভ", cancel: "বাতিল", close: "বন্ধ", confirm: "নিশ্চিত", loading: "লোড হচ্ছে...", search: "খুঁজুন",
    yes: "হ্যাঁ", no: "না", required: "আবশ্যক", optional: "ঐচ্ছিক",
    fieldRequired: "এই ক্ষেত্রটি আবশ্যক", invalidEmail: "অবৈধ ইমেইল", invalidPhone: "অবৈধ ফোন",
    pending: "অপেক্ষমাণ", preparing: "প্রস্তুত হচ্ছে", ready: "প্রস্তুত", delivered: "ডেলিভার করা হয়েছে", cancelled: "বাতিল",
    open: "খোলা", closed: "বন্ধ", openHours: "খোলার সময়", today: "আজ",
    noItems: "কিছু পাওয়া যায়নি", noOrders: "এখনো কোন অর্ডার নেই", noReviews: "এখনো কোন রিভিউ নেই",
  },
  hi: {
    order: "ऑर्डर", track: "ट्रैक", book: "बुक", reviews: "समीक्षा", account: "मैं", chat: "चैट",
    menu: "मेनू", cart: "कार्ट", addToCart: "कार्ट में जोड़ें", viewCart: "कार्ट देखें", emptyCart: "आपका कार्ट खाली है", browseMenu: "मेनू देखें",
    quantity: "मात्रा", remove: "हटाएं", subtotal: "उप-योग", total: "कुल", continue: "जारी रखें", back: "वापस",
    checkout: "चेकआउट", delivery: "डिलीवरी", collection: "संग्रहण", eatIn: "यहां खाएं", takeaway: "टेकअवे",
    yourDetails: "आपका विवरण", name: "नाम", phone: "फोन", email: "ईमेल", address: "पता", postcode: "पोस्टकोड",
    deliveryNotes: "डिलीवरी नोट (वैकल्पिक)", placeOrder: "ऑर्डर करें", payNow: "अभी भुगतान करें", payOnDelivery: "डिलीवरी पर नकद",
    payOnCollection: "संग्रह पर भुगतान",
    orderConfirmed: "ऑर्डर पुष्टि!", thankYou: "धन्यवाद", orderNumber: "ऑर्डर नंबर", estimatedTime: "अनुमानित समय",
    deliveryCode: "डिलीवरी कोड", showToDriver: "ड्राइवर को दिखाएं", paid: "ऑनलाइन भुगतान", orderAgain: "फिर से ऑर्डर", receipt: "रसीद",
    bookTable: "टेबल बुक करें", date: "तिथि", time: "समय", guests: "मेहमान", specialRequests: "विशेष अनुरोध",
    confirmReservation: "बुकिंग पुष्टि", bookingConfirmed: "बुकिंग पुष्टि!",
    save: "सेव", cancel: "रद्द", close: "बंद करें", confirm: "पुष्टि", loading: "लोड हो रहा है...", search: "खोजें",
    yes: "हां", no: "नहीं", required: "आवश्यक", optional: "वैकल्पिक",
    fieldRequired: "यह फ़ील्ड आवश्यक है", invalidEmail: "अमान्य ईमेल", invalidPhone: "अमान्य फोन",
    pending: "लंबित", preparing: "तैयार हो रहा", ready: "तैयार", delivered: "वितरित", cancelled: "रद्द",
    open: "खुला", closed: "बंद", openHours: "खुलने का समय", today: "आज",
    noItems: "कुछ नहीं मिला", noOrders: "अभी तक कोई ऑर्डर नहीं", noReviews: "अभी तक कोई समीक्षा नहीं",
  },
  pl: {
    order: "Zamów", track: "Śledź", book: "Rezerwuj", reviews: "Opinie", account: "Ja", chat: "Czat",
    menu: "Menu", cart: "Koszyk", addToCart: "Dodaj do koszyka", viewCart: "Zobacz koszyk", emptyCart: "Twój koszyk jest pusty", browseMenu: "Przeglądaj menu",
    quantity: "Ilość", remove: "Usuń", subtotal: "Razem", total: "Suma", continue: "Kontynuuj", back: "Wstecz",
    checkout: "Kasa", delivery: "Dostawa", collection: "Odbiór", eatIn: "Na miejscu", takeaway: "Na wynos",
    yourDetails: "Twoje dane", name: "Imię", phone: "Telefon", email: "E-mail", address: "Adres", postcode: "Kod pocztowy",
    deliveryNotes: "Uwagi do dostawy (opcjonalne)", placeOrder: "Złóż zamówienie", payNow: "Zapłać teraz", payOnDelivery: "Płatność przy odbiorze",
    payOnCollection: "Płatność przy odbiorze",
    orderConfirmed: "Zamówienie potwierdzone!", thankYou: "Dziękujemy", orderNumber: "Numer zamówienia", estimatedTime: "Szacowany czas",
    deliveryCode: "Kod dostawy", showToDriver: "Pokaż kierowcy", paid: "Zapłacono online", orderAgain: "Zamów ponownie", receipt: "Paragon",
    bookTable: "Zarezerwuj stolik", date: "Data", time: "Godzina", guests: "Goście", specialRequests: "Specjalne życzenia",
    confirmReservation: "Potwierdź rezerwację", bookingConfirmed: "Rezerwacja potwierdzona!",
    save: "Zapisz", cancel: "Anuluj", close: "Zamknij", confirm: "Potwierdź", loading: "Ładowanie...", search: "Szukaj",
    yes: "Tak", no: "Nie", required: "Wymagane", optional: "Opcjonalne",
    fieldRequired: "To pole jest wymagane", invalidEmail: "Nieprawidłowy e-mail", invalidPhone: "Nieprawidłowy telefon",
    pending: "Oczekujące", preparing: "Przygotowywanie", ready: "Gotowe", delivered: "Dostarczone", cancelled: "Anulowane",
    open: "Otwarte", closed: "Zamknięte", openHours: "Godziny otwarcia", today: "Dziś",
    noItems: "Nie znaleziono", noOrders: "Brak zamówień", noReviews: "Brak opinii",
  },
  es: {
    order: "Pedir", track: "Rastrear", book: "Reservar", reviews: "Reseñas", account: "Yo", chat: "Chat",
    menu: "Menú", cart: "Carrito", addToCart: "Añadir al carrito", viewCart: "Ver carrito", emptyCart: "Tu carrito está vacío", browseMenu: "Ver menú",
    quantity: "Cantidad", remove: "Eliminar", subtotal: "Subtotal", total: "Total", continue: "Continuar", back: "Atrás",
    checkout: "Pagar", delivery: "Entrega", collection: "Recogida", eatIn: "Comer aquí", takeaway: "Para llevar",
    yourDetails: "Tus datos", name: "Nombre", phone: "Teléfono", email: "Correo", address: "Dirección", postcode: "Código postal",
    deliveryNotes: "Notas de entrega (opcional)", placeOrder: "Realizar pedido", payNow: "Pagar ahora", payOnDelivery: "Pago contra entrega",
    payOnCollection: "Pagar al recoger",
    orderConfirmed: "¡Pedido confirmado!", thankYou: "Gracias", orderNumber: "Número de pedido", estimatedTime: "Tiempo estimado",
    deliveryCode: "Código de entrega", showToDriver: "Mostrar al repartidor", paid: "Pagado en línea", orderAgain: "Pedir otra vez", receipt: "Recibo",
    bookTable: "Reservar mesa", date: "Fecha", time: "Hora", guests: "Invitados", specialRequests: "Peticiones especiales",
    confirmReservation: "Confirmar reserva", bookingConfirmed: "¡Reserva confirmada!",
    save: "Guardar", cancel: "Cancelar", close: "Cerrar", confirm: "Confirmar", loading: "Cargando...", search: "Buscar",
    yes: "Sí", no: "No", required: "Obligatorio", optional: "Opcional",
    fieldRequired: "Este campo es obligatorio", invalidEmail: "Correo inválido", invalidPhone: "Teléfono inválido",
    pending: "Pendiente", preparing: "Preparando", ready: "Listo", delivered: "Entregado", cancelled: "Cancelado",
    open: "Abierto", closed: "Cerrado", openHours: "Horario", today: "Hoy",
    noItems: "Sin resultados", noOrders: "No hay pedidos", noReviews: "Sin reseñas",
  },
  ar: {
    order: "طلب", track: "تتبع", book: "حجز", reviews: "تقييمات", account: "أنا", chat: "محادثة",
    menu: "القائمة", cart: "السلة", addToCart: "أضف إلى السلة", viewCart: "عرض السلة", emptyCart: "سلتك فارغة", browseMenu: "تصفح القائمة",
    quantity: "الكمية", remove: "إزالة", subtotal: "المجموع الفرعي", total: "المجموع", continue: "متابعة", back: "رجوع",
    checkout: "الدفع", delivery: "توصيل", collection: "استلام", eatIn: "تناول هنا", takeaway: "خارجي",
    yourDetails: "بياناتك", name: "الاسم", phone: "الهاتف", email: "البريد الإلكتروني", address: "العنوان", postcode: "الرمز البريدي",
    deliveryNotes: "ملاحظات التوصيل (اختياري)", placeOrder: "تأكيد الطلب", payNow: "ادفع الآن", payOnDelivery: "الدفع عند التوصيل",
    payOnCollection: "الدفع عند الاستلام",
    orderConfirmed: "تم تأكيد الطلب!", thankYou: "شكراً", orderNumber: "رقم الطلب", estimatedTime: "الوقت المقدر",
    deliveryCode: "رمز التوصيل", showToDriver: "اعرض على السائق", paid: "مدفوع إلكترونياً", orderAgain: "اطلب مرة أخرى", receipt: "إيصال",
    bookTable: "حجز طاولة", date: "التاريخ", time: "الوقت", guests: "الضيوف", specialRequests: "طلبات خاصة",
    confirmReservation: "تأكيد الحجز", bookingConfirmed: "تم تأكيد الحجز!",
    save: "حفظ", cancel: "إلغاء", close: "إغلاق", confirm: "تأكيد", loading: "جاري التحميل...", search: "بحث",
    yes: "نعم", no: "لا", required: "مطلوب", optional: "اختياري",
    fieldRequired: "هذا الحقل مطلوب", invalidEmail: "بريد إلكتروني غير صحيح", invalidPhone: "هاتف غير صحيح",
    pending: "معلق", preparing: "قيد التحضير", ready: "جاهز", delivered: "تم التوصيل", cancelled: "ملغي",
    open: "مفتوح", closed: "مغلق", openHours: "ساعات العمل", today: "اليوم",
    noItems: "لا توجد عناصر", noOrders: "لا توجد طلبات", noReviews: "لا توجد تقييمات",
  },
  it: {
    order: "Ordina", track: "Traccia", book: "Prenota", reviews: "Recensioni", account: "Io", chat: "Chat",
    menu: "Menu", cart: "Carrello", addToCart: "Aggiungi al carrello", viewCart: "Vedi carrello", emptyCart: "Il tuo carrello è vuoto", browseMenu: "Sfoglia menu",
    quantity: "Quantità", remove: "Rimuovi", subtotal: "Subtotale", total: "Totale", continue: "Continua", back: "Indietro",
    checkout: "Cassa", delivery: "Consegna", collection: "Ritiro", eatIn: "Al tavolo", takeaway: "Da asporto",
    yourDetails: "I tuoi dati", name: "Nome", phone: "Telefono", email: "Email", address: "Indirizzo", postcode: "CAP",
    deliveryNotes: "Note consegna (opzionale)", placeOrder: "Conferma ordine", payNow: "Paga ora", payOnDelivery: "Pagamento alla consegna",
    payOnCollection: "Paga al ritiro",
    orderConfirmed: "Ordine confermato!", thankYou: "Grazie", orderNumber: "Numero ordine", estimatedTime: "Tempo stimato",
    deliveryCode: "Codice consegna", showToDriver: "Mostra al fattorino", paid: "Pagato online", orderAgain: "Ordina di nuovo", receipt: "Ricevuta",
    bookTable: "Prenota tavolo", date: "Data", time: "Ora", guests: "Ospiti", specialRequests: "Richieste speciali",
    confirmReservation: "Conferma prenotazione", bookingConfirmed: "Prenotazione confermata!",
    save: "Salva", cancel: "Annulla", close: "Chiudi", confirm: "Conferma", loading: "Caricamento...", search: "Cerca",
    yes: "Sì", no: "No", required: "Obbligatorio", optional: "Opzionale",
    fieldRequired: "Questo campo è obbligatorio", invalidEmail: "Email non valida", invalidPhone: "Telefono non valido",
    pending: "In attesa", preparing: "In preparazione", ready: "Pronto", delivered: "Consegnato", cancelled: "Annullato",
    open: "Aperto", closed: "Chiuso", openHours: "Orari", today: "Oggi",
    noItems: "Nessun risultato", noOrders: "Nessun ordine", noReviews: "Nessuna recensione",
  },
};

// Get translation - falls back to English if missing
export function t(key, lang) {
  const language = lang || getCurrentLanguage();
  const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
  return translations[key] || TRANSLATIONS.en[key] || key;
}

// Get current language from localStorage or detect
export function getCurrentLanguage() {
  try {
    const saved = localStorage.getItem('latavola_language');
    if (saved && TRANSLATIONS[saved]) return saved;
    
    // Auto-detect from browser
    const browserLang = navigator.language?.split('-')[0] || 'en';
    if (TRANSLATIONS[browserLang]) return browserLang;
  } catch (e) {}
  return 'en';
}

// Set language
export function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  try {
    localStorage.setItem('latavola_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGUAGES[lang].dir;
  } catch (e) {}
}
