'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
//  Dữ liệu bảng chữ cái tiếng Việt (29 chữ)
// ---------------------------------------------------------------------------
const ALPHABET = [
  { letter: 'A', lower: 'a', name: 'a',   example: 'An' },
  { letter: 'Ă', lower: 'ă', name: 'á',   example: 'Ăn' },
  { letter: 'Â', lower: 'â', name: 'â',   example: 'Âu' },
  { letter: 'B', lower: 'b', name: 'bờ',  example: 'Ba' },
  { letter: 'C', lower: 'c', name: 'cờ',  example: 'Cá' },
  { letter: 'D', lower: 'd', name: 'dờ',  example: 'Dê' },
  { letter: 'Đ', lower: 'đ', name: 'đờ',  example: 'Đi' },
  { letter: 'E', lower: 'e', name: 'e',   example: 'Em' },
  { letter: 'Ê', lower: 'ê', name: 'ê',   example: 'Êm' },
  { letter: 'G', lower: 'g', name: 'gờ',  example: 'Gà' },
  { letter: 'H', lower: 'h', name: 'hờ',  example: 'Hà' },
  { letter: 'I', lower: 'i', name: 'i',   example: 'Im' },
  { letter: 'K', lower: 'k', name: 'ca',  example: 'Kê' },
  { letter: 'L', lower: 'l', name: 'lờ',  example: 'La' },
  { letter: 'M', lower: 'm', name: 'mờ',  example: 'Ma' },
  { letter: 'N', lower: 'n', name: 'nờ',  example: 'Na' },
  { letter: 'O', lower: 'o', name: 'o',   example: 'Oi' },
  { letter: 'Ô', lower: 'ô', name: 'ô',   example: 'Ôm' },
  { letter: 'Ơ', lower: 'ơ', name: 'ơ',   example: 'Ơi' },
  { letter: 'P', lower: 'p', name: 'pờ',  example: 'Pin' },
  { letter: 'Q', lower: 'q', name: 'quy', example: 'Quà' },
  { letter: 'R', lower: 'r', name: 'rờ',  example: 'Ra' },
  { letter: 'S', lower: 's', name: 'sờ',  example: 'Sa' },
  { letter: 'T', lower: 't', name: 'tờ',  example: 'Ta' },
  { letter: 'U', lower: 'u', name: 'u',   example: 'Um' },
  { letter: 'Ư', lower: 'ư', name: 'ư',   example: 'Ưu' },
  { letter: 'V', lower: 'v', name: 'vờ',  example: 'Vì' },
  { letter: 'X', lower: 'x', name: 'xờ',  example: 'Xa' },
  { letter: 'Y', lower: 'y', name: 'y',   example: 'Yêu' },
];

type AlphabetItem = typeof ALPHABET[number];

// Màu sắc xoay vòng
const CARD_BG   = ['#ebf4ff','#f0fff4','#faf5ff','#fffaf0','#fff5f5','#e6fffa','#ebf8ff','#fefce8'];
const CARD_TEXT = ['#2b6cb0','#276749','#6b46c1','#c05621','#c53030','#276749','#2c7a7b','#92400e'];

// ---------------------------------------------------------------------------
//  Speech helper — phát âm tiếng Việt, trả về Promise khi kết thúc
// ---------------------------------------------------------------------------
function speakVi(text: string, rate = 0.8): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const vi = voices.find((v) => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
    if (vi) u.voice = vi;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// ---------------------------------------------------------------------------
//  LetterCard — thẻ trong lưới danh sách
// ---------------------------------------------------------------------------
function LetterCard({ item, index, visible, active, onClick }: {
  item: AlphabetItem; index: number; visible: boolean;
  active: boolean; onClick: () => void;
}) {
  const bg   = CARD_BG[index % CARD_BG.length];
  const text = CARD_TEXT[index % CARD_TEXT.length];
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? text : bg,
        border: `2px solid ${text}`,
        borderRadius: '14px',
        padding: '10px 6px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        transition: 'all 0.2s ease, opacity 0.4s ease, transform 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(16px)',
        transitionDelay: `${index * 35}ms`,
        WebkitTapHighlightColor: 'transparent',
        boxShadow: active ? `0 4px 16px ${text}44` : '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Chữ hoa */}
      <span style={{
        fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
        fontWeight: 800,
        color: active ? '#fff' : text,
        lineHeight: 1,
        fontFamily: '"Segoe UI", "Noto Sans", system-ui, sans-serif',
      }}>
        {item.letter}
      </span>
      {/* Chữ thường — nằm dưới */}
      <span style={{
        fontSize: 'clamp(1rem, 3.2vw, 1.4rem)',
        fontWeight: 600,
        color: active ? '#ffffffbb' : text,
        opacity: 0.65,
        lineHeight: 1,
        fontFamily: '"Segoe UI", "Noto Sans", system-ui, sans-serif',
      }}>
        {item.lower}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
//  LetterPopup — popup chi tiết 1 chữ, full màn hình
// ---------------------------------------------------------------------------
function LetterPopup({ item, index, onClose }: {
  item: AlphabetItem; index: number; onClose: () => void;
}) {
  const bg   = CARD_BG[index % CARD_BG.length];
  const text = CARD_TEXT[index % CARD_TEXT.length];
  const [countdown, setCountdown] = useState(5);
  const isSpeaking = useRef(false);
  const closedRef  = useRef(false);

  const playTwice = useCallback(async () => {
    if (isSpeaking.current || closedRef.current) return;
    isSpeaking.current = true;
    await speakVi(item.name, 0.75);
    if (closedRef.current) { isSpeaking.current = false; return; }
    await new Promise<void>((r) => setTimeout(r, 600));
    if (closedRef.current) { isSpeaking.current = false; return; }
    await speakVi(item.name, 0.65);
    isSpeaking.current = false;
  }, [item.name]);

  useEffect(() => {
    closedRef.current = false;
    playTwice();
    return () => {
      closedRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, [playTwice]);

  useEffect(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(interval); onClose(); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  const handleReplay = () => {
    if (!isSpeaking.current) speakVi(item.name, 0.7);
  };

  // Tỉ lệ vòng tròn countdown
  const pct = (countdown / 5) * 283; // circumference ≈ 283 (r=45)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Countdown ring + nút đóng — góc trên */}
      <div style={{
        position: 'absolute', top: '16px', left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px',
      }}>
        {/* SVG countdown ring */}
        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke={`${text}22`} strokeWidth="4" />
          <circle
            cx="26" cy="26" r="22" fill="none"
            stroke={text} strokeWidth="4"
            strokeDasharray={`${(countdown / 5) * 138} 138`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s linear' }}
          />
          <text
            x="26" y="26"
            dominantBaseline="middle" textAnchor="middle"
            fill={text} fontSize="13" fontWeight="700"
            style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px' }}
          >{countdown}</text>
        </svg>

        {/* Nút đóng */}
        <button
          onClick={onClose}
          style={{
            background: `${text}18`, border: `2px solid ${text}33`,
            borderRadius: '50%', width: '44px', height: '44px',
            cursor: 'pointer', fontSize: '1.1rem', color: text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Chữ hoa + thường — nhấn để phát lại */}
      <button
        onClick={handleReplay}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'clamp(4px, 1dvh, 12px)',
          padding: '0 20px',
          WebkitTapHighlightColor: 'transparent',
          lineHeight: 1,
        }}
        title="Nhấn để nghe lại"
      >
        {/* Chữ hoa */}
        <span style={{
          fontSize: 'clamp(8rem, 35vw, 16rem)',
          fontWeight: 900,
          color: text,
          lineHeight: 1,
          fontFamily: '"Segoe UI", "Noto Sans", system-ui, sans-serif',
          textShadow: `0 4px 24px ${text}44`,
        }}>
          {item.letter}
        </span>
        {/* Chữ thường — nằm dưới */}
        <span style={{
          fontSize: 'clamp(5rem, 22vw, 10rem)',
          fontWeight: 700,
          color: text,
          opacity: 0.5,
          lineHeight: 1,
          fontFamily: '"Segoe UI", "Noto Sans", system-ui, sans-serif',
        }}>
          {item.lower}
        </span>
      </button>

      {/* Gợi ý */}
      <div style={{
        position: 'absolute', bottom: '24px',
        fontSize: '0.78rem', color: `${text}88`,
        fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span>🔊 Nhấn vào chữ để nghe lại</span>
        <span>·</span>
        <span>Tự đóng sau {countdown}s</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Page chính
// ---------------------------------------------------------------------------
export default function BangChuCaiPage() {
  const [started,    setStarted]    = useState(false);
  const [visible,    setVisible]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState<number | null>(null);
  const [popupItem,  setPopupItem]  = useState<{ item: AlphabetItem; index: number } | null>(null);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [started]);

  const handleCardClick = (idx: number) => {
    setActiveIdx(idx);
    setPopupItem({ item: ALPHABET[idx], index: idx });
  };

  const handleClosePopup = useCallback(() => {
    setPopupItem(null);
    setActiveIdx(null);
  }, []);

  // ---- Màn hình index ----
  if (!started) {
    return (
      <>
        <style>{`
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.7); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{
          minHeight: '100dvh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '40px 32px',
            textAlign: 'center', maxWidth: '380px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🇻🇳</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2d3748', margin: '0 0 8px' }}>
              Bảng chữ cái tiếng Việt
            </h1>
            <p style={{ color: '#718096', margin: '0 0 32px', fontSize: '0.95rem', lineHeight: 1.6 }}>
              29 chữ cái · Nhấn vào mỗi chữ để nghe phát âm
            </p>
            <button
              onClick={() => setStarted(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff', border: 'none', borderRadius: '50px',
                padding: '14px 40px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', width: '100%',
                boxShadow: '0 8px 20px rgba(102,126,234,0.4)',
              }}
            >
              ▶ Bắt đầu học
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---- Màn hình danh sách ----
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn  {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay danh sách */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', zIndex: 100,
        animation: 'fadeIn 0.25s ease',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px',
          width: '100%', maxWidth: '640px',
          height: 'calc(100dvh - 32px)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#2d3748' }}>
                🇻🇳 Bảng chữ cái tiếng Việt
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#a0aec0' }}>
                Nhấn vào chữ để nghe phát âm
              </p>
            </div>
            <button
              onClick={() => { setStarted(false); setVisible(false); setPopupItem(null); }}
              style={{
                background: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '50%',
                width: '36px', height: '36px', cursor: 'pointer',
                fontSize: '1rem', color: '#718096',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* Lưới chữ cái */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: '8px', alignContent: 'start',
          }}>
            {ALPHABET.map((item, idx) => (
              <LetterCard
                key={item.letter}
                item={item} index={idx}
                visible={visible}
                active={activeIdx === idx}
                onClick={() => handleCardClick(idx)}
              />
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #f0f0f0',
            textAlign: 'center', fontSize: '0.78rem', color: '#a0aec0', flexShrink: 0,
          }}>
            {activeIdx !== null && !popupItem
              ? `🔊 ${ALPHABET[activeIdx].letter}${ALPHABET[activeIdx].lower} — ${ALPHABET[activeIdx].name}`
              : `${ALPHABET.length} chữ cái · Nhấn để nghe`}
          </div>
        </div>
      </div>

      {/* Popup chi tiết chữ */}
      {popupItem && (
        <LetterPopup
          item={popupItem.item}
          index={popupItem.index}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}
