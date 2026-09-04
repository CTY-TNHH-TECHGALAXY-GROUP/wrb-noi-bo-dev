"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
// import useBookingStore or localStorage
import { useMenuData } from "@/components/Menu/MenuContext";
import { ArrowLeft, Calendar, Clock, User, Users, ChevronRight, ShieldCheck } from "lucide-react";
import { languages } from "@/app/(intro)/LanguageSelector.lang";
import { getTranslation } from "./ContactedFirst.i18n";
import { format } from "date-fns";

export default function ContactedFirstPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // Add customer form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDate, setNewDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState(() => format(new Date(), 'HH:mm'));
  const [newNotes, setNewNotes] = useState('');
  const [newGuests, setNewGuests] = useState<number | ''>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const texts = getTranslation(lang);

  useEffect(() => {
    fetchTodayPreBookings();
  }, []);

  const fetchTodayPreBookings = async () => {
    try {
      setLoading(true);
      // Get today's date in YYYY-MM-DD format (local time)
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('PreBookings')
        .select('*')
        .eq('booking_date', localDate)
        .eq('status', 'PENDING')
        .order('booking_time', { ascending: true });

      if (error) {
        console.error("Error fetching pre-bookings:", error);
        console.error("Error fetching pre-bookings:", error);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newName || !newPhone || !newGuests || !newDate || !newTime) return;
    setIsSubmitting(true);
    try {
      const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;
      
      const { error } = await supabase.from('PreBookings').insert([{
        customer_name: newName,
        customer_phone: newPhone,
        guest_count: Number(newGuests),
        booking_date: newDate,
        booking_time: formattedTime,
        notes: newNotes,
        status: 'PENDING'
      }]);

      if (!error) {
        setNewName('');
        setNewPhone('');
        setNewGuests(1);
        setNewNotes('');
        setNewDate(format(new Date(), 'yyyy-MM-dd'));
        setNewTime(format(new Date(), 'HH:mm'));
        setShowAddForm(false);
        fetchTodayPreBookings();
      } else {
        console.error("Insert error:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "KH";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    // Mask 0901234567 to 0901 *** 567
    if (phone.length >= 10) {
      return phone.substring(0, 4) + " *** " + phone.substring(phone.length - 3);
    }
    return phone;
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    // time is like "14:30:00"
    const [h, m] = time.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; 
    return `${hour}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleSelectBooking = (booking: any) => {
    setSelectedBooking(booking);
    // Lưu vào localStorage để checkout sử dụng
    const contactedInfo = {
      preBookingId: booking.id,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone,
      guestCount: booking.guest_count || 1,
      notes: booking.notes
    };
    
    localStorage.setItem('contactedFirstInfo', JSON.stringify(contactedInfo));
    
    // Bỏ qua màn hình trung gian, chuyển luôn sang trang chọn sách (Menu)
    setIsExiting(true);
    setTimeout(() => {
      router.push(`/${lang}/select-menu`);
    }, 250);
  };

  const handleBackToList = () => {
    setShowNext(false);
    setSelectedBooking(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleContinue = () => {
    // Code cũ không dùng tới nữa
    router.push(`/${lang}/select-menu`);
  };



  return (
    <div className={styles.root}>
      {!showNext ? (
        <main className={`${styles.screen} ${isExiting ? styles.screenLeave : ''}`}>
          <Link href={`/${lang}/standard/menu`} className={styles.back} aria-label="Go back">
            <ArrowLeft size={28} strokeWidth={1.5} />
          </Link>

          <header className={styles.brand}>
            <div
              className="mx-auto relative flex items-center justify-center text-[#f5df8b] drop-shadow-[0_0_12px_rgba(222,180,79,0.22)]"
              style={{
                width: "260px",
                height: "200px",
                marginBottom: "8px"
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-[#d8b34e]/20 rounded-full blur-xl animate-pulse"></div>
              <div 
                className="w-full h-full relative z-10" 
                style={{
                    backgroundColor: "#f7ebc7",
                    WebkitMaskImage: "url('/Image/oria-spa-logo.png')",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url('/Image/oria-spa-logo.png')",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                }}
              />
            </div>
          </header>

          <section className={styles.intro}>
            <h1>{texts.title}</h1>
            <p className={styles.lead}>{texts.lead}</p>
          </section>

          <section className={styles.list}>
            {loading ? (
              <div className={styles.loader}></div>
            ) : bookings.length === 0 ? (
              <div className={styles.emptyState}>{texts.empty}</div>
            ) : (
              bookings.map((booking) => (
                <button 
                  key={booking.id} 
                  className={styles.booking} 
                  onClick={() => handleSelectBooking(booking)}
                >
                  <div className={styles.avatar}>{getInitials(booking.customer_name)}</div>
                  <div>
                    <div className={styles.name}>{booking.customer_name}</div>
                    <div className={styles.phone}>{maskPhone(booking.customer_phone)}</div>
                  </div>
                  <div className={styles.meta}>
                    <div className={styles.metaRow}>
                      <span className={styles.ico}><Calendar size={18} /></span>
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.ico}><Clock size={18} /></span>
                      <span>{formatTime(booking.booking_time)}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.ico}>{booking.guest_count > 1 ? <Users size={18} /> : <User size={18} />}</span>
                      <span>{booking.guest_count} {texts.guests}</span>
                    </div>
                  </div>
                  <div className={styles.chevron}><ChevronRight size={32} /></div>
                </button>
              ))
            )}

            {/* Subtle Add Button */}
            <div className={styles.addTrigger} onClick={() => setShowAddForm(!showAddForm)}>
              + {texts.addBtn}
            </div>

            {/* Full Width Modal */}
            {showAddForm && (
              <div className={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>{texts.addTitle}</div>
                  <div className={styles.modalBody}>
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{texts.addName}</label>
                        <input 
                          className={styles.inputField}
                          placeholder={texts.addName} 
                          value={newName} 
                          onChange={e => setNewName(e.target.value)} 
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{texts.addPhone}</label>
                        <input 
                          className={styles.inputField}
                          placeholder={texts.addPhone} 
                          value={newPhone} 
                          onChange={e => setNewPhone(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className={styles.inputRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{texts.addDate}</label>
                        <input 
                          type="date"
                          className={styles.inputField}
                          value={newDate} 
                          onChange={e => setNewDate(e.target.value)} 
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{texts.addTime}</label>
                        <input 
                          type="time"
                          className={styles.inputField}
                          value={newTime} 
                          onChange={e => setNewTime(e.target.value)} 
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{texts.guests}</label>
                        <input 
                          type="number" 
                          min="1" 
                          className={styles.inputField}
                          value={newGuests} 
                          onChange={e => setNewGuests(e.target.value ? parseInt(e.target.value) : '')} 
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>{texts.addNotes}</label>
                      <input 
                        className={styles.inputField}
                        placeholder={texts.addNotes} 
                        value={newNotes} 
                        onChange={e => setNewNotes(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                      {texts.cancelBtn}
                    </button>
                    <button className={styles.submitBtn} onClick={handleAddCustomer} disabled={isSubmitting || !newName || !newPhone || !newDate || !newTime}>
                      {texts.addSubmit}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={styles.privacy}>
            <div className={styles.privacyIcon}><ShieldCheck size={28} strokeWidth={1.5} color="#4589ff" /></div>
            <div className={styles.privacyText}>
              <div>{texts.privacy}</div>
            </div>
          </section>

          <nav className={styles.flags}>
            {languages.map((l) => (
              <button 
                key={l.id} 
                className={`${styles.lang} ${lang === l.id ? styles.langActive : ''}`} 
                onClick={() => {
                  router.push(`/${l.id}/contacted-first`);
                }}
              >
                <div className={styles.flag}>
                  <Image src={l.flag} alt={l.name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
              </button>
            ))}
          </nav>
        </main>
      ) : (
        <section className={styles.screen}>
          <header className={styles.brand}>
            <div className={styles.brandLogo}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-[#d8b34e]/20 rounded-full blur-xl animate-pulse"></div>
              <div 
                className="w-full h-full relative z-10" 
                style={{
                    backgroundColor: "#f7ebc7",
                    WebkitMaskImage: "url('/Image/oria-spa-logo.png')",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url('/Image/oria-spa-logo.png')",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                }}
              />
            </div>
          </header>

          <div className={styles.nextWrap}>
            <div className={styles.nextCard}>
              <h2>{texts.nextTitle}</h2>
              <p><b>{selectedBooking?.customer_name}</b> {texts.nextText}</p>
              
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  className={styles.nextBtn} 
                  style={{ background: 'transparent', border: '1px solid rgba(241,203,105,.42)', color: '#cdc5b9' }}
                  onClick={handleBackToList}
                >
                  {texts.backBtn}
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={handleContinue}
                >
                  {texts.nextBtn}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
