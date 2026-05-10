'use client';
import { useFlashcards } from '../hooks/useFlashcards';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../lib/types';

type StudyMode = 'flashcard' | 'typing' | 'quiz';
type TabName = 'study' | 'deck' | 'stats' | 'settings';

export default function Home() {
    const {
        cards, filterType, changeFilter,
        srsData, sessionStats, stats,
        queue, queuePos, isDone,
        isFlipped, hasRevealed, toggleFlip, swipeDirection,
        currentCard, currentSrs,
        handleRate, nextInterval, fmtInterval,
        startSession, updateSettings, settings,
        filteredMap, addCard, editCard
    } = useFlashcards();

    const [isStudying, setIsStudying] = useState(false);
    const [studyMode, setStudyMode] = useState<StudyMode>('flashcard');
    const [activeTab, setActiveTab] = useState<TabName>('study');
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [viewCardIndex, setViewCardIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [newCard, setNewCard] = useState<Partial<Card>>({ t: 'Danh từ' });
    const [editingCard, setEditingCard] = useState<Partial<Card>>({});
    const [tempSettings, setTempSettings] = useState(settings);

    // Typing State
    const [typingInput, setTypingInput] = useState('');
    const [typingState, setTypingState] = useState<'idle' | 'wrong' | 'revealed'>('idle');
    const inputRef = useRef<HTMLInputElement>(null);

    // Quiz State
    const [quizOptions, setQuizOptions] = useState<Card[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

    useEffect(() => {
        setTempSettings(settings);
    }, [settings]);

    const playAudio = useCallback((text: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/\[|\]/g, ''));
            utterance.lang = 'ja-JP';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    useEffect(() => {
        if (isStudying && currentCard && !isFlipped && !isAddModalOpen && !isSettingsOpen) {
            if (studyMode === 'flashcard') {
                playAudio(currentCard.k);
            }
            
            // Reset typing
            setTypingInput('');
            setTypingState('idle');
            if (studyMode === 'typing' && inputRef.current) {
                inputRef.current.focus();
            }

            // Generate quiz
            if (studyMode === 'quiz') {
                const safeFiltered = filteredMap.filter(i => cards[i] !== currentCard);
                const pool = [...safeFiltered].sort(() => Math.random() - 0.5).slice(0, 3);
                const ops = [...pool.map(i => cards[i]), currentCard];
                setQuizOptions(ops.sort(() => Math.random() - 0.5));
                setSelectedOptionIndex(null);
            }
        }
    }, [isStudying, queuePos, currentCard, studyMode, isFlipped, isAddModalOpen, isSettingsOpen, playAudio, filteredMap, cards]);

    const getTags = (c: Card) => {
        const tags = [];
        if (c.t === 'Tính từ な') tags.push('Na-adjective');
        else if (c.t === 'Tính từ い') tags.push('I-adjective');
        else tags.push(c.t);

        if (c.tip && c.tip.toLowerCase().includes('mượn')) tags.push('Từ mượn tiếng Anh');
        else if (c.k.match(/^[ア-ン]+(?:\[.*?\])?$/)) tags.push('Katakana');
        return tags;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAddModalOpen || isSettingsOpen || !isStudying) return;
            if (studyMode === 'typing') return; // Typing handles its own enter

            if (e.key === ' ' || e.key === 'Enter') { 
                e.preventDefault(); 
                if (studyMode === 'flashcard') toggleFlip();
            }
            else if (studyMode === 'flashcard') {
                if (e.key === '1' && hasRevealed) handleRate('again');
                else if (e.key === '2' && hasRevealed) handleRate('hard');
                else if (e.key === '3' && hasRevealed) handleRate('good');
            }
            else if (studyMode === 'quiz') {
                if (e.key === '1' && quizOptions.length > 0) selectQuizOption(0);
                if (e.key === '2' && quizOptions.length > 1) selectQuizOption(1);
                if (e.key === '3' && quizOptions.length > 2) selectQuizOption(2);
                if (e.key === '4' && quizOptions.length > 3) selectQuizOption(3);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isAddModalOpen, isSettingsOpen, isStudying, studyMode, toggleFlip, handleRate, hasRevealed, quizOptions]);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCard.k && newCard.v) {
            addCard({
                k: newCard.k,
                h: newCard.h || '',
                v: newCard.v,
                t: newCard.t || 'Danh từ',
                ej: newCard.ej || '',
                ev: newCard.ev || '',
                tip: newCard.tip || '',
                img: newCard.img || undefined
            } as Card);
            setIsAddModalOpen(false);
            setNewCard({ t: 'Danh từ' });
        }
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings(tempSettings);
        setIsSettingsOpen(false);
    };

    const openViewModal = (index: number) => {
        setViewCardIndex(index);
        setIsEditMode(false);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (viewCardIndex !== null && editingCard.k && editingCard.v) {
            editCard(viewCardIndex, editingCard as Card);
            setIsEditMode(false);
        }
    };

    const handleStartSession = (mode: StudyMode) => {
        setStudyMode(mode);
        startSession();
        setIsStudying(true);
    };

    const submitTyping = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCard) return;

        if (typingState === 'revealed') {
            handleRate('again');
            return;
        }

        const val = typingInput.trim().toLowerCase();
        if (!val) return;

        const cleanK = currentCard.k.replace(/\[|\]/g, '');
        if (val === cleanK || val === currentCard.h) {
            playAudio(currentCard.k);
            handleRate('good');
        } else {
            setTypingState('wrong');
            setTimeout(() => {
                setTypingState('revealed');
                playAudio(currentCard.k);
            }, 500);
        }
    };

    const selectQuizOption = (idx: number) => {
        if (selectedOptionIndex !== null || !currentCard) return;
        setSelectedOptionIndex(idx);
        const chosen = quizOptions[idx];
        if (chosen === currentCard) {
            playAudio(currentCard.k);
            setTimeout(() => handleRate('good'), 800);
        } else {
            playAudio(currentCard.k);
            setTimeout(() => handleRate('again'), 1500);
        }
    };

    const renderKanji = (card: Card) => {
        const k = card.k;
        const match = k.match(/^(.*?)\[(.*?)\]$/);
        if (match) {
            return (
                <div className="kanji-wrapper has-bracket">
                    <ruby>{match[1]}<rt>{card.h}</rt></ruby>
                    <span className="kanji-bracket">[{match[2]}]</span>
                </div>
            );
        }
        return (
            <div className="kanji-wrapper">
                <ruby>{k}<rt>{card.h}</rt></ruby>
            </div>
        );
    };

    const renderStudyFace = () => {
        if (!currentCard || !currentSrs) return null;

        if (studyMode === 'flashcard') {
            return (
                <>
                    <div className="card-face card-front">
                        <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
                        <span className="card-type-badge">{currentCard.t}</span>
                        
                        <div className="kanji-area">
                            {renderKanji(currentCard)}
                            <button className="audio-btn" onClick={(e) => playAudio(currentCard.k, e)}>🔊</button>
                        </div>

                        {currentCard.img && (
                            <div className="card-img-container">
                                <img src={currentCard.img} alt="illustration" />
                            </div>
                        )}

                        <span className={`srs-badge ${currentSrs.state}`}>
                            {currentSrs.state === 'new' ? 'Mới' : currentSrs.state === 'learn' ? 'Học lại' : 'Ôn tập'}
                        </span>
                        <div className="flip-hint">Nhấn lật thẻ</div>
                    </div>
                    <div className="card-face card-back">
                        <div className="card-tags">
                            {getTags(currentCard).map(t => <span key={t} className="tag-pill">{t}</span>)}
                        </div>

                        <div className="meaning-block">
                            <div className="meaning-vn">{currentCard.v}</div>
                            {currentCard.tip && !currentCard.tip.toLowerCase().includes('mượn') && (
                                <div className="meaning-sub">{currentCard.tip}</div>
                            )}
                            {currentCard.tip && currentCard.tip.toLowerCase().includes('mượn') && (
                                <div className="meaning-sub muted">
                                    {currentCard.tip.replace(/Từ mượn ?/i, '').replace(/["']/g, '')}
                                </div>
                            )}
                        </div>
                        
                        {currentCard.img && (
                            <div className="card-img-container back-img">
                                <img src={currentCard.img} alt="illustration" />
                            </div>
                        )}

                        <div className="example-block">
                            <div className="example-jp">{currentCard.ej}</div>
                            <div className="example-vn">{currentCard.ev}</div>
                        </div>

                        <button className="flip-back-btn" onClick={(e) => { e.stopPropagation(); toggleFlip(); }}>
                            ⟲ Xem mặt trước
                        </button>
                    </div>
                </>
            );
        }

        if (studyMode === 'typing') {
            return (
                <div className="card-face card-typing" onClick={(e) => e.stopPropagation()}>
                    <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
                    <span className="card-type-badge">{currentCard.t}</span>
                    
                    <div className="typing-prompt">
                        <div className="meaning-vn">{currentCard.v}</div>
                    </div>

                    <form className="typing-form" onSubmit={submitTyping}>
                        <input
                            ref={inputRef}
                            type="text"
                            className={`typing-input ${typingState}`}
                            placeholder="Gõ Hiragana hoặc Kanji..."
                            value={typingInput}
                            onChange={(e) => setTypingInput(e.target.value)}
                            disabled={typingState === 'revealed'}
                            autoFocus
                        />
                        {typingState === 'revealed' && (
                            <div className="typing-answer">
                                <span className="ans-k">{currentCard.k.replace(/\[|\]/g, '')}</span>
                                <span className="ans-h">{currentCard.h}</span>
                                <button type="submit" className="next-btn-small" autoFocus>Tiếp tục</button>
                            </div>
                        )}
                    </form>
                </div>
            );
        }

        if (studyMode === 'quiz') {
            return (
                <div className="card-face card-quiz" onClick={(e) => e.stopPropagation()}>
                    <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
                    
                    <div className="quiz-prompt">
                        <div className="meaning-vn">{currentCard.v}</div>
                        {currentCard.img && (
                            <div className="card-img-container back-img" style={{marginTop: '10px'}}>
                                <img src={currentCard.img} alt="illustration" />
                            </div>
                        )}
                    </div>

                    <div className="quiz-grid">
                        {quizOptions.map((opt, idx) => {
                            const isSelected = selectedOptionIndex === idx;
                            const isCorrectCard = opt === currentCard;
                            const showCorrect = selectedOptionIndex !== null && isCorrectCard;
                            const showWrong = isSelected && !isCorrectCard;

                            let btnClass = 'quiz-btn';
                            if (showCorrect) btnClass += ' correct';
                            else if (showWrong) btnClass += ' wrong';
                            else if (selectedOptionIndex !== null) btnClass += ' disabled';

                            return (
                                <button 
                                    key={idx} 
                                    className={btnClass}
                                    onClick={() => selectQuizOption(idx)}
                                    disabled={selectedOptionIndex !== null}
                                >
                                    <span className="q-k">{opt.k.replace(/\[|\]/g, '')}</span>
                                    {selectedOptionIndex !== null && <span className="q-h">{opt.h}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }
    };

    return (
        <>
            <div className="deco-mark" style={{ fontSize: '260px', top: '-20px', right: '-30px' }}>日</div>
            <div className="deco-mark" style={{ fontSize: '180px', bottom: '60px', left: '-20px' }}>語</div>

            {!isStudying ? (
                <div className="dashboard-view" style={{ paddingBottom: '70px' }}>
                    <header>
                        <div className="jp-title">日本語 Flashcards</div>
                        <div className="sub">Tiếng Nhật · Cuộc sống ở Nhật thế nào?</div>
                    </header>

                    {activeTab === 'study' && (
                        <>
                            <div className="stats-row" style={{ marginTop: '20px' }}>
                                <div className="stat-chip">
                                    <div className="dot dot-new"></div><span>{stats.nN}</span>&nbsp;mới
                                </div>
                                <div className="stat-chip">
                                    <div className="dot dot-learn"></div><span>{stats.nL}</span>&nbsp;học lại
                                </div>
                                <div className="stat-chip">
                                    <div className="dot dot-review"></div><span>{stats.nR}</span>&nbsp;đã ôn
                                </div>
                            </div>

                            <div className="action-bars-list">
                                <div className="master-action-bar primary" onClick={() => handleStartSession('flashcard')}>
                                    <div className="ab-icon">▤</div>
                                    <div className="ab-content">
                                        <div className="ab-title">Lật thẻ</div>
                                        <div className="ab-sub">Ôn tập theo SRS · {stats.nL + stats.nR + stats.nN} thẻ chờ</div>
                                    </div>
                                    <div className="ab-arrow">→</div>
                                </div>
                                <div className="master-action-bar" onClick={() => handleStartSession('quiz')}>
                                    <div className="ab-icon">⊞</div>
                                    <div className="ab-content">
                                        <div className="ab-title">Trắc nghiệm</div>
                                        <div className="ab-sub">4 đáp án · chọn nghĩa đúng</div>
                                    </div>
                                    <div className="ab-arrow">→</div>
                                </div>
                                <div className="master-action-bar" onClick={() => handleStartSession('typing')}>
                                    <div className="ab-icon">›_</div>
                                    <div className="ab-content">
                                        <div className="ab-title">Gõ từ</div>
                                        <div className="ab-sub">Tự nhập câu trả lời · luyện chính tả</div>
                                    </div>
                                    <div className="ab-arrow">→</div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'deck' && (
                        <>
                            <div className="action-bar" style={{ marginTop: '20px' }}>
                                <div className="section-title" style={{ margin: 0, flex: 1 }}>Tổng quan bộ thẻ ({filteredMap.length})</div>
                                <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)} style={{ flex: 'none' }}>
                                    <span className="mode-icon">＋</span> Thêm từ
                                </button>
                            </div>

                            <div className="filter-bar">
                                {['all', 'Tính từ な', 'Tính từ い', 'Danh từ', 'Phó từ', 'Liên từ'].map(t => (
                                    <button
                                        key={t}
                                        className={`filter-btn ${filterType === t ? 'active' : ''}`}
                                        onClick={() => changeFilter(t)}
                                    >
                                        {t === 'all' ? 'Tất cả' : t}
                                    </button>
                                ))}
                            </div>

                            <div className="mini-grid">
                        {filteredMap.map((allIdx, fIdx) => {
                            const c = cards[allIdx];
                            const srs = srsData[allIdx];
                            if (!c || !srs) return null;
                            const now = Date.now();
                            const isDue = srs.state === 'learn' || (srs.dueDate && srs.dueDate <= now);
                            const dc = srs.state === 'new' ? '#ccc' : isDue ? 'var(--again)' : 'var(--good)';
                            
                            return (
                                <div key={fIdx} className="mini-card" onClick={() => openViewModal(allIdx)}>
                                    <span className="mk">{c.k.replace(/\[|\]/g, '')}</span>
                                    <span className="mh">{c.h}</span>
                                    <span className="mv">{c.v}</span>
                                    <span className="mini-dot" style={{ background: dc }}></span>
                                </div>
                            );
                        })}
                    </div>
                        </>
                    )}

                    {activeTab === 'stats' && (
                        <div style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                            <div>Trang Thống kê sẽ được phát triển ở Giai đoạn tiếp theo.</div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="section-title">Cài Đặt Ôn Tập</div>
                            <form onSubmit={(e) => { e.preventDefault(); updateSettings(tempSettings); }} className="modal-form" style={{ marginTop: '10px' }}>
                                <div className="form-group">
                                    <label>Số thẻ mới tối đa mỗi ngày:</label>
                                    <input type="number" min="1" max="100" value={tempSettings.dailyNew} onChange={e => setTempSettings({...tempSettings, dailyNew: Number(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label>Số thẻ ôn tối đa mỗi ngày:</label>
                                    <input type="number" min="1" max="500" value={tempSettings.dailyReview} onChange={e => setTempSettings({...tempSettings, dailyReview: Number(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label>Hệ số thuật toán (Ease Multiplier):</label>
                                    <select value={tempSettings.easeMultiplier} onChange={e => setTempSettings({...tempSettings, easeMultiplier: Number(e.target.value)})}>
                                        <option value={0.8}>0.8 (Khó nhớ, lặp lại nhiều)</option>
                                        <option value={1.0}>1.0 (Tiêu chuẩn)</option>
                                        <option value={1.2}>1.2 (Dễ nhớ, giãn cách nhanh)</option>
                                        <option value={1.5}>1.5 (Rất dễ nhớ)</option>
                                    </select>
                                </div>
                                <button type="submit" className="submit-btn" style={{ marginTop: '20px' }}>Lưu Cài Đặt</button>
                            </form>
                        </div>
                    )}

                    <nav className="bottom-tab-bar">
                        <button className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`} onClick={() => setActiveTab('study')}>
                            <span className="tab-icon">◈</span>
                            <span>Học</span>
                        </button>
                        <button className={`tab-btn ${activeTab === 'deck' ? 'active' : ''}`} onClick={() => setActiveTab('deck')}>
                            <span className="tab-icon">☰</span>
                            <span>Bộ thẻ</span>
                        </button>
                        <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                            <span className="tab-icon">◒</span>
                            <span>Thống kê</span>
                        </button>
                        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                            <span className="tab-icon">⚙︎</span>
                            <span>Cài đặt</span>
                        </button>
                    </nav>
                </div>
            ) : (
                <div className="study-view">
                    <div className="study-header">
                        <button className="btn-secondary" onClick={() => setIsStudying(false)}>← Trang chủ</button>
                    </div>

                    {isDone ? (
                        <div className="session-done visible" id="sessionDone">
                            <div className="done-emoji">🎉</div>
                            <div className="done-title">Hoàn thành phiên học!</div>
                            <div className="done-sub">Bạn đã ôn xong số thẻ mục tiêu trong ngày.</div>
                            <div className="done-stats">
                                <div className="done-stat">
                                    <div className="n" style={{ color: 'var(--good)' }}>{sessionStats.good + sessionStats.easy}</div>
                                    <div className="l">Nhớ</div>
                                </div>
                                <div className="done-stat">
                                    <div className="n" style={{ color: 'var(--hard)' }}>{sessionStats.hard}</div>
                                    <div className="l">Khó</div>
                                </div>
                                <div className="done-stat">
                                    <div className="n" style={{ color: 'var(--again)' }}>{sessionStats.again}</div>
                                    <div className="l">Quên</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '15px', fontWeight: 600 }}>
                                Độ chính xác: {Math.round(((sessionStats.good + sessionStats.easy) / Math.max(1, sessionStats.good + sessionStats.easy + sessionStats.hard + sessionStats.again)) * 100)}%
                            </div>
                            <button className="btn-restart" onClick={() => setIsStudying(false)} style={{ marginTop: '20px' }}>Về trang chủ</button>
                        </div>
                    ) : queue.length === 0 ? (
                        <div className="session-done visible">
                            <div className="done-emoji">✨</div>
                            <div className="done-title">Không có thẻ nào đến hạn!</div>
                            <div className="done-sub">Bạn đã hoàn thành mọi mục tiêu của ngày hôm nay. Hãy quay lại vào ngày mai nhé.</div>
                            <button className="btn-restart" onClick={() => setIsStudying(false)}>Về trang chủ</button>
                        </div>
                    ) : (
                        <>
                            <div className="progress-bar-wrap">
                                <div className="progress-info">
                                    <span>{queuePos + 1} / {queue.length}</span>
                                </div>
                                <div className="progress-dots">
                                    {queue.map((_, idx) => (
                                        <div key={idx} className={`progress-seg ${idx < queuePos ? 'done' : idx === queuePos ? 'active' : ''}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="card-scene">
                                <div className={`card-slide ${swipeDirection ? `swipe-${swipeDirection}` : 'anim'}`} key={queuePos}>
                                    <div className={`card ${isFlipped && studyMode === 'flashcard' ? 'flipped' : ''}`} onClick={() => studyMode === 'flashcard' && toggleFlip()}>
                                        {renderStudyFace()}
                                    </div>
                                </div>
                            </div>

                            {studyMode === 'flashcard' && (
                                <div className="anki-area">
                                    {!hasRevealed ? (
                                        <button className="show-answer-btn" onClick={toggleFlip}>
                                            Hiện đáp án &nbsp;·&nbsp; Space
                                        </button>
                                    ) : (
                                        <div className="anki-row visible">
                                            <button className="anki-btn btn-again" onClick={() => handleRate('again')}>
                                                <div className="icon-box">↻</div>
                                                <span className="anki-label">Lại</span>
                                                <span className="anki-interval">Ôn lại ngay</span>
                                            </button>
                                            <button className="anki-btn btn-hard" onClick={() => handleRate('hard')}>
                                                <div className="icon-box">⏱</div>
                                                <span className="anki-label">Khó</span>
                                                <span className="anki-interval">Sau {fmtInterval(nextInterval(currentSrs!, 'hard'))}</span>
                                            </button>
                                            <button className="anki-btn btn-good" onClick={() => handleRate('good')}>
                                                <div className="icon-box">✓</div>
                                                <span className="anki-label">Nhớ</span>
                                                <span className="anki-interval">Sau {fmtInterval(nextInterval(currentSrs!, 'good'))}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {isAddModalOpen && (
                // ... same modal code
                <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Thêm Từ Mới</h3>
                            <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Từ (Kanji):</label>
                                <input required type="text" value={newCard.k || ''} onChange={e => setNewCard({...newCard, k: e.target.value})} placeholder="VD: 静か[な]" />
                            </div>
                            <div className="form-group">
                                <label>Cách đọc (Hiragana):</label>
                                <input required type="text" value={newCard.h || ''} onChange={e => setNewCard({...newCard, h: e.target.value})} placeholder="VD: しずか" />
                            </div>
                            <div className="form-group">
                                <label>Nghĩa VN:</label>
                                <input required type="text" value={newCard.v || ''} onChange={e => setNewCard({...newCard, v: e.target.value})} placeholder="VD: yên tĩnh" />
                            </div>
                            <div className="form-group">
                                <label>Loại từ:</label>
                                <select value={newCard.t} onChange={e => setNewCard({...newCard, t: e.target.value as any})}>
                                    <option>Danh từ</option>
                                    <option>Động từ</option>
                                    <option>Tính từ い</option>
                                    <option>Tính từ な</option>
                                    <option>Phó từ</option>
                                    <option>Liên từ</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ví dụ JP (Tuỳ chọn):</label>
                                <input type="text" value={newCard.ej || ''} onChange={e => setNewCard({...newCard, ej: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Ví dụ VN (Tuỳ chọn):</label>
                                <input type="text" value={newCard.ev || ''} onChange={e => setNewCard({...newCard, ev: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Tip nhớ (Tuỳ chọn):</label>
                                <input type="text" value={newCard.tip || ''} onChange={e => setNewCard({...newCard, tip: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Link Ảnh (Tuỳ chọn):</label>
                                <input type="text" value={newCard.img || ''} onChange={e => setNewCard({...newCard, img: e.target.value})} placeholder="https://..." />
                            </div>
                            <button type="submit" className="submit-btn">Lưu thẻ</button>
                        </form>
                    </div>
                </div>
            )}

            {isSettingsOpen && (
                <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cài Đặt Ôn Tập</h3>
                            <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="modal-form">
                            <div className="form-group">
                                <label>Số thẻ mới tối đa mỗi ngày:</label>
                                <input type="number" min="1" max="100" value={tempSettings.dailyNew} onChange={e => setTempSettings({...tempSettings, dailyNew: Number(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label>Số thẻ ôn tối đa mỗi ngày:</label>
                                <input type="number" min="1" max="500" value={tempSettings.dailyReview} onChange={e => setTempSettings({...tempSettings, dailyReview: Number(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label>Hệ số thuật toán (Ease Multiplier):</label>
                                <select value={tempSettings.easeMultiplier} onChange={e => setTempSettings({...tempSettings, easeMultiplier: Number(e.target.value)})}>
                                    <option value={0.8}>0.8 (Khó nhớ, lặp lại nhiều)</option>
                                    <option value={1.0}>1.0 (Tiêu chuẩn)</option>
                                    <option value={1.2}>1.2 (Dễ nhớ, giãn cách nhanh)</option>
                                    <option value={1.5}>1.5 (Rất dễ nhớ)</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-btn">Lưu Cài Đặt</button>
                        </form>
                    </div>
                </div>
            )}

            {viewCardIndex !== null && (
                <div className="modal-overlay" onClick={() => { setViewCardIndex(null); setIsEditMode(false); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{isEditMode ? 'Chỉnh Sửa Từ' : 'Chi Tiết Từ Vựng'}</h3>
                            <button className="close-btn" onClick={() => { setViewCardIndex(null); setIsEditMode(false); }}>×</button>
                        </div>
                        
                        {!isEditMode ? (
                            <div className="card-detail-view">
                                <div className="detail-kanji-row">
                                    {renderKanji(cards[viewCardIndex])}
                                    <button className="audio-btn" onClick={() => playAudio(cards[viewCardIndex].k)}>🔊</button>
                                </div>
                                <div className="detail-type">{cards[viewCardIndex].t}</div>
                                <div className="detail-meaning">{cards[viewCardIndex].v}</div>
                                {cards[viewCardIndex].tip && <div className="detail-tip">💡 {cards[viewCardIndex].tip}</div>}
                                
                                {cards[viewCardIndex].img && (
                                    <img className="detail-img" src={cards[viewCardIndex].img} alt="illustration" />
                                )}

                                <div className="detail-example">
                                    {cards[viewCardIndex].ej && <div className="ej">{cards[viewCardIndex].ej}</div>}
                                    {cards[viewCardIndex].ev && <div className="ev">{cards[viewCardIndex].ev}</div>}
                                </div>
                                
                                <div className="action-bar" style={{ justifyContent: 'flex-end', margin: '20px 0 0 0' }}>
                                    <button className="btn-secondary" onClick={() => {
                                        setEditingCard({...cards[viewCardIndex]});
                                        setIsEditMode(true);
                                    }}>Sửa từ này</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleEditSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Từ (Kanji):</label>
                                    <input required type="text" value={editingCard.k || ''} onChange={e => setEditingCard({...editingCard, k: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Cách đọc (Hiragana):</label>
                                    <input required type="text" value={editingCard.h || ''} onChange={e => setEditingCard({...editingCard, h: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Nghĩa VN:</label>
                                    <input required type="text" value={editingCard.v || ''} onChange={e => setEditingCard({...editingCard, v: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Loại từ:</label>
                                    <select value={editingCard.t} onChange={e => setEditingCard({...editingCard, t: e.target.value as any})}>
                                        <option>Danh từ</option>
                                        <option>Động từ</option>
                                        <option>Tính từ い</option>
                                        <option>Tính từ な</option>
                                        <option>Phó từ</option>
                                        <option>Liên từ</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ví dụ JP:</label>
                                    <input type="text" value={editingCard.ej || ''} onChange={e => setEditingCard({...editingCard, ej: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Ví dụ VN:</label>
                                    <input type="text" value={editingCard.ev || ''} onChange={e => setEditingCard({...editingCard, ev: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Tip nhớ:</label>
                                    <input type="text" value={editingCard.tip || ''} onChange={e => setEditingCard({...editingCard, tip: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Link Ảnh:</label>
                                    <input type="text" value={editingCard.img || ''} onChange={e => setEditingCard({...editingCard, img: e.target.value})} />
                                </div>
                                <div className="action-bar" style={{ justifyContent: 'flex-end', margin: '10px 0 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsEditMode(false)}>Hủy</button>
                                    <button type="submit" className="submit-btn" style={{ margin: 0 }}>Lưu thay đổi</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
