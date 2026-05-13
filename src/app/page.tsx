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
    /** Bump to force StatsPanel to re-fetch after a study session. */
    const [statsVersion, setStatsVersion] = useState(0);

    const handleStart = (mode: StudyMode) => {
        setStudyMode(mode);
        fc.startSession();
        setIsStudying(true);
    };

    const handleExit = () => {
        setIsStudying(false);
        setStatsVersion((v) => v + 1);
    };

    if (fc.isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-emoji">📚</div>
                <div>Đang tải bộ thẻ...</div>
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
                modalOpen={false}
            />
        );
    }

    const modalOpen = isAddOpen || viewIdx !== null;
    const viewCard = viewIdx !== null ? fc.cards[viewIdx] : null;

    return (
        <>
            <div className="deco-mark" style={{ fontSize: '260px', top: '-20px', right: '-30px' }}>
                日
            </div>
            <div className="deco-mark" style={{ fontSize: '180px', bottom: '60px', left: '-20px' }}>
                語
            </div>

            <div className="dashboard-view" style={{ paddingBottom: 70 }}>
                <header>
                    <div className="jp-title">日本語 Flashcards</div>
                    <div className="sub">Tiếng Nhật</div>
                </header>

                {activeTab === 'study' && (
                    <>
                        <div className="stats-row" style={{ marginTop: 20 }}>
                            <div className="stat-chip">
                                <div className="dot dot-new" />
                                <span>{fc.stats.nN}</span>&nbsp;mới
                            </div>
                            <div className="stat-chip">
                                <div className="dot dot-learn" />
                                <span>{fc.stats.nL}</span>&nbsp;học lại
                            </div>
                            <div className="stat-chip">
                                <div className="dot dot-review" />
                                <span>{fc.stats.nDue}</span>&nbsp;đến hạn
                            </div>
                        </div>

                        <div className="action-bars-list">
                            <button
                                type="button"
                                className="master-action-bar primary"
                                onClick={() => handleStart('flashcard')}
                            >
                                <div className="ab-icon">▤</div>
                                <div className="ab-content">
                                    <div className="ab-title">Lật thẻ</div>
                                    <div className="ab-sub">
                                        Ôn tập theo SRS · {fc.stats.nN + fc.stats.nL + fc.stats.nDue} thẻ chờ
                                    </div>
                                </div>
                                <div className="ab-arrow">→</div>
                            </button>
                            <button
                                type="button"
                                className="master-action-bar"
                                onClick={() => handleStart('quiz')}
                            >
                                <div className="ab-icon">⊞</div>
                                <div className="ab-content">
                                    <div className="ab-title">Trắc nghiệm</div>
                                    <div className="ab-sub">4 đáp án · chọn nghĩa đúng</div>
                                </div>
                                <div className="ab-arrow">→</div>
                            </button>
                            <button
                                type="button"
                                className="master-action-bar"
                                onClick={() => handleStart('typing')}
                            >
                                <div className="ab-icon">›_</div>
                                <div className="ab-content">
                                    <div className="ab-title">Gõ từ</div>
                                    <div className="ab-sub">Tự nhập câu trả lời · luyện chính tả</div>
                                </div>
                                <div className="ab-arrow">→</div>
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'deck' && (
                    <DeckBrowser
                        cards={fc.cards}
                        srsData={fc.srsData}
                        filteredMap={fc.filteredMap}
                        filterType={fc.filterType}
                        onChangeFilter={fc.changeFilter}
                        onOpenCard={(idx) => setViewIdx(idx)}
                        onOpenAdd={() => setIsAddOpen(true)}
                    />
                )}

                {activeTab === 'stats' && <StatsPanel version={statsVersion} />}

                {activeTab === 'settings' && (
                    <SettingsPanel settings={fc.settings} onSave={fc.updateSettings} />
                )}
            </div>

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

            {/* Keyboard suppression while modals are open is handled by the
                StudySession component itself (modalOpen prop) — but since we
                only render StudySession when !isStudying, that branch is
                inactive here. */}
            {modalOpen && <span hidden />}
        </>
    );
}
