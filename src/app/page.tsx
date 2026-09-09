'use client';
import { useState } from 'react';
import { BottomTabBar, type TabName } from '../components/BottomTabBar';
import { AddCardModal } from '../components/deck/AddCardModal';
import { DeckBrowser } from '../components/deck/DeckBrowser';
import { ViewEditCardModal } from '../components/deck/ViewEditCardModal';
import { SettingsPanel } from '../components/settings/SettingsPanel';
import { StatsPanel } from '../components/stats/StatsPanel';
import { StudySession, type StudyMode } from '../components/study/StudySession';
import { useFlashcards } from '../hooks/useFlashcards';

export default function Home() {
    const fc = useFlashcards();
    const [activeTab, setActiveTab] = useState<TabName>('study');
    const [studyMode, setStudyMode] = useState<StudyMode>('flashcard');
    const [isStudying, setIsStudying] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [viewIdx, setViewIdx] = useState<number | null>(null);
    const [statsVersion, setStatsVersion] = useState(0);

    const handleStart = (mode: StudyMode) => {
        setStudyMode(mode);
        fc.startSession();
        setIsStudying(true);
    };

    const handleExit = () => {
        setIsStudying(false);
        setStatsVersion((version) => version + 1);
    };

    if (fc.isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-nihon" aria-label="Nihongo">
                    <span className="nihon-char">に</span>
                    <span className="nihon-char">ほ</span>
                    <span className="nihon-char">ん</span>
                    <span className="nihon-char">ご</span>
                </div>
                <div className="loading-bar-track">
                    <div className="loading-bar-fill" />
                </div>
                <div className="loading-text">Đang chuẩn bị phiên học</div>
            </div>
        );
    }

    if (isStudying) {
        return (
            <StudySession
                studyMode={studyMode}
                cards={fc.cards}
                filteredMap={fc.filteredMap}
                queue={fc.queue}
                queuePos={fc.queuePos}
                currentCard={fc.currentCard}
                currentSrs={fc.currentSrs}
                isFlipped={fc.isFlipped}
                hasRevealed={fc.hasRevealed}
                swipeDirection={fc.swipeDirection}
                isDone={fc.isDone}
                sessionStats={fc.sessionStats}
                nextInterval={fc.nextInterval}
                fmtInterval={fc.fmtInterval}
                onToggleFlip={fc.toggleFlip}
                onRate={fc.handleRate}
                onExit={handleExit}
                onJumpTo={fc.jumpTo}
                modalOpen={false}
            />
        );
    }

    const viewCard = viewIdx !== null ? fc.cards[viewIdx] : null;
    const dueTotal = fc.stats.nN + fc.stats.nL + fc.stats.nDue;

    return (
        <>
            <main className="taste-shell">
                <header className="taste-header">
                    <div className="taste-brand-block">
                        <div className="taste-kicker">LEARN JP · 日本語</div>
                        <h1 className="taste-title">Học ít hơn.<br />Nhớ lâu hơn.</h1>
                        <p className="taste-intro">
                            Một không gian học yên, tập trung vào từ đang cần nhớ — không leaderboard, không confetti, không dashboard thừa.
                        </p>
                    </div>
                    <div className="taste-seal" aria-hidden="true">日</div>
                </header>

                {activeTab === 'study' && (
                    <section className="taste-study-panel" aria-label="Bắt đầu học">
                        <div className="taste-session-summary">
                            <div className="taste-summary-copy">
                                <span className="taste-section-label">HÔM NAY</span>
                                <strong>{dueTotal} thẻ cần xử lý</strong>
                            </div>
                            <dl className="taste-metrics">
                                <div><dt>Mới</dt><dd>{fc.stats.nN}</dd></div>
                                <div><dt>Học lại</dt><dd>{fc.stats.nL}</dd></div>
                                <div><dt>Đến hạn</dt><dd>{fc.stats.nDue}</dd></div>
                            </dl>
                        </div>

                        <div className="taste-mode-list">
                            <button type="button" className="taste-mode taste-mode-primary" onClick={() => handleStart('flashcard')}>
                                <span className="taste-mode-index">01</span>
                                <span className="taste-mode-copy">
                                    <strong>Ôn bằng thẻ</strong>
                                    <small>SRS · lật đáp án · tự chấm mức nhớ</small>
                                </span>
                                <span className="taste-mode-arrow" aria-hidden="true">↗</span>
                            </button>

                            <button type="button" className="taste-mode" onClick={() => handleStart('test')}>
                                <span className="taste-mode-index">02</span>
                                <span className="taste-mode-copy">
                                    <strong>Kiểm tra</strong>
                                    <small>Trắc nghiệm xen kẽ điền từ</small>
                                </span>
                                <span className="taste-mode-arrow" aria-hidden="true">↗</span>
                            </button>

                            <button type="button" className="taste-mode taste-mode-experimental" onClick={() => handleStart('test-mystery')}>
                                <span className="taste-mode-index">03</span>
                                <span className="taste-mode-copy">
                                    <strong>Ngẫu nhiên</strong>
                                    <small>Chọn thẻ không biết trước nội dung</small>
                                </span>
                                <span className="taste-mode-note">thử nghiệm</span>
                            </button>
                        </div>

                        <p className="taste-footnote">Gợi ý: bắt đầu với Ôn bằng thẻ. Hai chế độ còn lại dùng để kiểm tra sau khi đã có vòng nhớ đầu tiên.</p>
                    </section>
                )}

                {activeTab === 'deck' && (
                    <section className="taste-content-panel">
                        <DeckBrowser
                            cards={fc.cards}
                            srsData={fc.srsData}
                            filteredMap={fc.filteredMap}
                            filterType={fc.filterType}
                            onChangeFilter={fc.changeFilter}
                            onOpenCard={(index) => setViewIdx(index)}
                            onOpenAdd={() => setIsAddOpen(true)}
                            onDeleteCards={fc.deleteCards}
                        />
                    </section>
                )}

                {activeTab === 'stats' && (
                    <section className="taste-content-panel"><StatsPanel version={statsVersion} /></section>
                )}

                {activeTab === 'settings' && (
                    <section className="taste-content-panel">
                        <SettingsPanel settings={fc.settings} onSave={fc.updateSettings} />
                    </section>
                )}
            </main>

            <BottomTabBar active={activeTab} onChange={setActiveTab} />

            {isAddOpen && (
                <AddCardModal
                    onClose={() => setIsAddOpen(false)}
                    onSubmit={async (card) => {
                        await fc.addCard(card);
                    }}
                />
            )}

            {viewCard && viewIdx !== null && (
                <ViewEditCardModal
                    card={viewCard}
                    onClose={() => setViewIdx(null)}
                    onSave={async (updated) => {
                        await fc.editCard(viewIdx, updated);
                        setViewIdx(null);
                    }}
                />
            )}
        </>
    );
}
