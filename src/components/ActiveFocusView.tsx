/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Task, AppSettings } from '../types';
import { Play, Pause, CheckCircle, XCircle, AlertTriangle, Plus, Sliders, Trash2 } from 'lucide-react';
import { DEFAULT_TAG_CATEGORIES } from '../constants';
import { motion } from 'motion/react';
import { formatKoreanDate, getDaysElapsed, getDurationElapsedText, getFriendlyDaysAgo } from '../utils/dateUtils';

interface ActiveFocusViewProps {
  task: Task;
  settings: AppSettings;
  onPauseTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onAbandonTask: (id: string, reason: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartSubtask: (taskId: string, subtaskId: string) => void;
  onCompleteSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onRemoveSubtask: (taskId: string, subtaskId: string) => void;
  onCheerTask: (id: string) => void;
  onStartActivityLog: (taskId: string, text: string) => void;
  onEndActivityLog: (taskId: string, logId: string) => void;
  onBackToHome: () => void;
}

export function ActiveFocusView({
  task,
  settings,
  onPauseTask,
  onCompleteTask,
  onAbandonTask,
  onToggleSubtask,
  onStartSubtask,
  onCompleteSubtask,
  onAddSubtask,
  onRemoveSubtask,
  onBackToHome
}: ActiveFocusViewProps) {
  const categories = settings.customTags || DEFAULT_TAG_CATEGORIES;
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showAbandonPanel, setShowAbandonPanel] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');

  // Suffix formatting for subtasks total spent time
  const formatSubTaskDuration = (secs: number) => {
    if (secs < 60) return `${secs}초`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (remainingSecs === 0) return `${mins}분`;
    return `${mins}분 ${remainingSecs}초`;
  };

  // Convert seconds into HH:MM:SS or Korean friendly representation
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${remainingSeconds}초`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${remainingSeconds}초`;
  };

  // Calculated subtasks progress
  const completedStepsCount = useMemo(() => {
    return task.subtasks.filter(s => s.completed).length;
  }, [task.subtasks]);

  const progressPercent = useMemo(() => {
    if (task.subtasks.length === 0) return 0;
    return Math.round((completedStepsCount / task.subtasks.length) * 100);
  }, [task.subtasks, completedStepsCount]);

  const handleAddStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStepTitle.trim() === '') return;
    onAddSubtask(task.id, newStepTitle.trim());
    setNewStepTitle('');
  };

  const handleExecuteAbandon = () => {
    const finalReason = abandonReason.trim() || '의지 소모로 인한 잠시 보류';
    onAbandonTask(task.id, finalReason);
    setShowAbandonPanel(false);
    setAbandonReason('');
  };

  const hasUncompletedSteps = useMemo(() => {
    return task.subtasks.length > 0 && task.subtasks.some(st => !st.completed);
  }, [task.subtasks]);

  return (
    <div className="pb-28 text-[#1A1A1A]">
      {/* 1. MAIN TASK HEADER CARD (With a stronger active/focused background and prominent shadow styling) */}
      <div className="bg-gradient-to-br from-[#FFFDEB] via-[#FFF9E3] to-[#FFF3CD] border-4 border-black p-5 md:p-6 shadow-[7px_7px_0px_0px_#FF4D00] relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-[#FF4D00]/20 pointer-events-none filter blur-xl" />
        {/* Active badge */}
        <div className="absolute top-3 right-3 bg-[#FF4D00] text-white border-2 border-black text-[9px] font-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#000] uppercase tracking-wider hidden sm:block z-20 animate-bounce">
          🎯 실전 조준 집중 대상
        </div>

        {/* 1. 발생시점 및 입력정보 */}
        <p className="text-[11.5px] font-black text-zinc-650 mb-2 leading-relaxed relative z-10">
          <span className="text-[#FF4D00] font-black underline">
            {(() => {
              const val = task.tags.createdWhen;
              const cat = categories.find(c => c.id === 'createdWhen');
              const opt = cat?.options.find(o => o.value === val);
              return opt?.label || '미정';
            })()}
          </span>
          전 부터 하려고{" "}
          <span className="text-blue-600 font-extrabold text-xs">
            {formatKoreanDate(task.createdAt)}
          </span>
          {getDaysElapsed(task.createdAt) === 0 ? (
            <>
              에 입력.{" "}
              <span className="bg-yellow-250 text-black border border-black px-1.5 py-0.5 inline-block text-[10px] font-black leading-none uppercase">
                오늘.
              </span>
            </>
          ) : (
            <>
              에 입력, 그 후{" "}
              <span className="bg-yellow-250 text-black border border-black px-1.5 py-0.5 inline-block text-[10px] font-black leading-none uppercase">
                {getDurationElapsedText(task.createdAt)}
              </span>
              이 더 지남.
            </>
          )}
        </p>

        {(() => {
          const completedSubs = task.subtasks?.filter(st => st.completed && st.completedAt) || [];
          if (completedSubs.length === 0) return null;
          
          const latestCompletedAt = completedSubs.reduce((latest, current) => {
            if (!latest) return current.completedAt!;
            const latestTime = new Date(latest).getTime();
            const currentTime = new Date(current.completedAt!).getTime();
            return currentTime > latestTime ? current.completedAt! : latest;
          }, completedSubs[0].completedAt!);
          
          const friendlyWhen = getFriendlyDaysAgo(latestCompletedAt);
          return (
            <p className="text-[11px] font-black text-emerald-600 mb-2 leading-relaxed relative z-10 flex items-center gap-1.5 animate-pulse">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-400 px-1 py-0.5 text-[9px] font-black uppercase">
                <span className="underline">{friendlyWhen} 함</span>🔥
              </span>
            </p>
          );
        })()}

        {/* 2. 할 일 제목 */}
        <h3 className="text-xl md:text-2xl font-black text-black mb-3 leading-tight tracking-tight uppercase relative z-10">
          &ldquo;{task.title}&rdquo;
        </h3>

        {/* 3. 메모, 자세한 설명 */}
        {task.description && (
          <p className="text-[#1A1A1A]/80 text-xs md:text-sm mb-4 leading-relaxed pl-3 border-l-4 border-[#FF4D00] font-medium relative z-10">
            &ldquo;{task.description}&rdquo;
          </p>
        )}

        {/* 4. 각종 태그 */}
        <div className="flex flex-wrap gap-2 relative z-10">
          {categories.map((category) => {
            const value = task.tags[category.id];
            if (!value) return null;
            const option = category.options.find(opt => opt.value === value);
            if (!option) return null;
            return (
              <span key={category.id} className="text-[10px] font-black text-[#1A1A1A] bg-[#F4F4F1] px-2.5 py-1 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1">
                {option.icon && <span className="mr-0.5">{option.icon}</span>}
                {category.label.replace(/\s*\(.*?\)\s*/, '')}: {option.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC WORK SPLITTING & ACTIONS ENGINE */}
      <div className="bg-white border-4 border-black p-5 md:p-6 mb-6 space-y-5 shadow-[8px_8px_0px_0px_#000] relative">
        {/* Header decoration */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-0 border-black pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FF4D00] stroke-[3]" />
            <h4 className="text-sm font-black text-black uppercase tracking-tight">
              당장 진행할 세부 실천 행동 단계
            </h4>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black text-white bg-[#FF4D00] border-2 border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#000]">
              {completedStepsCount} / {task.subtasks.length} 완수
            </span>
          </div>
         </div>

        {/* Practical tips */}
        <div className="text-xs font-semibold text-zinc-700 bg-amber-50 border-3 border-dashed border-amber-300 p-3.5 flex items-start gap-2 rounded-none">
          <span className="text-base shrink-0">💡</span>
          <p className="leading-relaxed">
            한 번에 큰 프로젝트를 끝내는 사람은 세상에 없습니다! 
            <strong>무조건 '당장 30초 내에 움직일 수 있는 극소 단계'로 쪼개야</strong> 미룸 감옥에서 탈출할 수 있습니다. 
            할 일들을 구체적으로 쪼개 입력하신 뒤, 직접 실천을 개시할 때 <strong>[행동 개시 🚀]</strong>를 꾹 눌러주세요.
          </p>
        </div>

        {/* Input box */}
        <form onSubmit={handleAddStepSubmit} className="space-y-2">
          <label className="text-[10px] font-black uppercase text-black block">
            머리 안 아픈 직관적이고 미세한 실천 행동 등록하기:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="예: 아래한글 기안문 양치기, 노트북에 어댑터 꽂기, 참고 자료 1개 찾아 읽기 등"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              className="flex-1 bg-[#F4F4F1] border-3 border-black p-3 text-xs text-black font-black outline-none focus:bg-white focus:border-[#FF4D00]"
            />
            <button
              type="submit"
              disabled={!newStepTitle.trim()}
              className="bg-yellow-300 hover:bg-yellow-400 disabled:opacity-40 text-black border-3 border-black text-xs font-black py-3 sm:py-0 px-5 shadow-[3px_3px_0px_0px_#000] active:scale-95 transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3.5]" />
              행동 등록
            </button>
          </div>
        </form>


        {/* Subtask / Action List */}
        <div className="space-y-3 pt-1">
          <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider">
            세부 실천 행동 타임시트 & 기동 상태
          </span>

          {task.subtasks.length > 0 ? (
            <div className="space-y-2.5">
              {task.subtasks.map((st, idx) => {
                const isRunning = st.startedAt && !st.completed;
                const isCompleted = st.completed;
                const isPending = !st.startedAt && !st.completed;

                return (
                  <div
                    key={st.id}
                    className={`border-3 border-black p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isRunning 
                        ? 'bg-orange-50/70 border-[#FF4D00] shadow-[3px_3px_0px_0px_#FF4D00]' 
                        : isCompleted
                        ? 'bg-zinc-50/70 opacity-85 shadow-[1px_1px_0px_0px_#000]'
                        : 'bg-white shadow-[4px_4px_0px_0px_#000]'
                    }`}
                  >
                    {/* Visual details */}
                    <div className="flex-1 flex items-start gap-3">
                      <div className={`w-5.5 h-5.5 shrink-0 border-2 border-black flex items-center justify-center text-[10px] font-black mt-0.5 ${
                        isCompleted ? 'bg-[#a7f3d0] text-black' : isRunning ? 'bg-[#FF4D00] text-white animate-pulse' : 'bg-[#F4F4F1]'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className="space-y-0.5 flex-1">
                        <p className={`text-xs md:text-sm font-black text-black leading-tight ${isCompleted ? 'line-through text-zinc-450 text-zinc-400 font-bold' : ''}`}>
                          {st.title}
                        </p>

                        {/* Secondary status logs inside each step */}
                        {isRunning && (
                          <span className="inline-block text-[10px] text-[#FF4D00] font-bold">
                            ⏳ 기동 중! (시작: {new Date(st.startedAt!).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                          </span>
                        )}
                        {isCompleted && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] text-zinc-500 font-bold">
                            <span>✓ 완료 기입 완료</span>
                            {st.completedAt && (
                              <span>({new Date(st.completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 완료)</span>
                            )}
                            {st.durationSpent !== undefined && (
                              <span className="bg-emerald-50 text-emerald-850 border border-emerald-200 px-1.5 py-0.5 inline-block font-black uppercase text-[8.5px]">
                                ⏱️ {formatSubTaskDuration(st.durationSpent)} 사투기록
                              </span>
                            )}
                          </div>
                        )}
                        {isPending && (
                          <span className="inline-block text-[10px] text-zinc-500 font-bold">
                            💤 착수 무한 대기 중
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 border-zinc-200 pt-2.5 sm:pt-0">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onStartSubtask(task.id, st.id)}
                          className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black text-[10px] font-black py-1 px-3 shadow-[1.5px_1.5px_0px_0px_#000] active:scale-95 transition cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-black fill-current stroke-[3]" />
                          행동 개시 🚀
                        </button>
                      )}

                      {isRunning && (
                        <button
                          type="button"
                          onClick={() => onCompleteSubtask(task.id, st.id)}
                          className="bg-[#a7f3d0] hover:bg-emerald-300 text-black border-2 border-black text-[10px] font-black py-1 px-3 shadow-[1.5px_1.5px_0px_0px_#000] active:scale-95 transition cursor-pointer flex items-center gap-1"
                        >
                          행동 완료 ✅
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className="bg-white hover:bg-zinc-100 text-[#1A1A1A] border-2 border-zinc-300 text-[9px] font-bold py-0.5 px-2 active:scale-95 transition cursor-pointer"
                        >
                          완료 취소
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveSubtask(task.id, st.id)}
                        className="p-1 px-1.5 text-zinc-650 hover:bg-zinc-100 bg-white border border-black shadow-[1.2px_1.2px_0px_0px_#000] rounded active:scale-90 cursor-pointer"
                        title="해당 행동 영구 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 font-bold text-[11px] bg-[#F4F4F1] border-2 border-dashed border-black">
              ⚠️ 일이 너무 거대해 보이나요? <br />
              위의 입력기에 당장 3초 내로 개시할 수 있는 일을 2~3개 쪼개 등록해보세요!
            </div>
          )}
        </div>
      </div>

      {/* 3. PRIMARY CONTEXT CONTROLS (Overall actions for task status) */}
      {!showAbandonPanel ? (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {/* OVERALL COMPLETE BUTTON */}
            <button
              onClick={() => {
                if (hasUncompletedSteps) {
                  if (!confirm('아직 완료하지 않은 세부 행동들이 남아있습니다. 그래도 전체 할 일을 무조건 완료 처리하시겠습니까?')) {
                    return;
                  }
                }
                onCompleteTask(task.id);
                alert('🎉 장하다! 드디어 미뤘던 큰 짐을 무조건 덜어내셨군요!! 고생하셨습니다.');
                onBackToHome();
              }}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 bg-[#a7f3d0] hover:bg-emerald-300 text-black border-3 border-black font-black py-4 text-xs shadow-[4px_4px_0px_0px_#000] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 fill-current text-black stroke-[2.5]" />
              전체 끝장냈다! (전체 완료하기)
            </button>

            {/* OVERALL PAUSE BUTTON */}
            <button
              onClick={() => {
                onPauseTask(task.id);
                alert('쉼이 필요할 때입니다. 현재까지 누적 기록된 시간은 안전하게 보존되었습니다.');
                onBackToHome();
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#fef08a] hover:bg-yellow-250 text-black border-3 border-black font-black py-4 text-xs shadow-[4px_4px_0px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
            >
              <Pause className="w-4 h-4 stroke-[2.5]" />
              잠시 정지하기 (정비하기)
            </button>

            {/* OVERALL ABANDON BUTTON */}
            <button
              onClick={() => setShowAbandonPanel(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#fca5a5] hover:bg-rose-300 text-black border-3 border-black font-black py-4 text-xs shadow-[4px_4px_0px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4 stroke-[2.5]" />
              이유 쓰고 보류 (보류하기)
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onBackToHome}
              className="text-[11px] text-zinc-500 hover:text-black font-bold transition hover:underline cursor-pointer"
            >
              집중을 정지하지 않고 대시보드 화면 확인하기
            </button>
          </div>
        </div>
      ) : (
        /* ABANDON DIALOG PANEL */
        <div className="bg-white border-4 border-black p-5 space-y-4 shadow-[8px_8px_0px_0px_#000]">
          <div className="flex items-center gap-2 text-rose-600 font-black">
            <AlertTriangle className="w-4.5 h-4.5 stroke-[3]" />
            <h4 className="text-xs font-black uppercase">미룸을 대수롭게 넘기기 위한 하소연 사유 기록</h4>
          </div>
          <p className="text-[11px] text-[#1A1A1A] font-bold leading-relaxed">
            죄책감을 가질 필요는 전혀 전혀 없습니다! 지금 뇌의 작동 에너지가 소멸되었거나, 타이밍이 안 좋은 것뿐입니다. 다음 충전을 위해 변명이나 사유를 재미나게 기록해주세요 (포기 카드 보관함에 보존됩니다).
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-black block">솔직 거부 사유 작성:</label>
            <input
              type="text"
              placeholder="예: 침대가 너무 포근했음, 롤 한 판 하고 싶음, 스마트폰의 마력에 유인당함"
              value={abandonReason}
              onChange={(e) => setAbandonReason(e.target.value)}
              className="w-full bg-[#F4F4F1] border-3 border-black p-3 text-xs text-black font-bold outline-none focus:bg-white"
            />
          </div>

          <div className="flex gap-3.5 text-xs pt-1.5">
            <button
              onClick={() => setShowAbandonPanel(false)}
              className="flex-1 bg-white hover:bg-zinc-100 border-3 border-black text-black font-black py-3 text-xs shadow-[3px_3px_0px_0px_#000] active:scale-95 cursor-pointer"
            >
              다시 부딪혀볼게요! 🔥
            </button>
            <button
              onClick={handleExecuteAbandon}
              className="flex-1 bg-rose-300 text-black border-3 border-black font-black py-3 text-xs shadow-[3px_3px_0px_0px_#000] active:scale-95 cursor-pointer"
            >
              기록 기탁하고 보류 ☠️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
