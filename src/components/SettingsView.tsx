/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppSettings, Task, TagCategory, TagChoice } from '../types';
import { ShieldAlert, Trash2, Database, Download, Upload, Check, Sparkles, Volume2, Plus, Tag, FolderPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { DEFAULT_TAG_CATEGORIES } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  tasks: Task[];
  onSaveSettings: (settings: AppSettings) => void;
  onResetToSamples: () => void;
  onImportData: (jsonStr: string) => boolean;
}

export function SettingsView({ settings, tasks, onSaveSettings, onResetToSamples, onImportData }: SettingsViewProps) {
  const [userName, setUserName] = useState(settings.userName || '해야지러');
  const [playSounds, setPlaySounds] = useState(settings.playSounds ?? true);
  const [urgencyNotification, setUrgencyNotification] = useState(settings.urgencyNotification ?? true);
  
  // Tag Categories editing state
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  
  // Category-specific inputs dictionary state
  const [optionLabelInputs, setOptionLabelInputs] = useState<Record<string, string>>({});
  const [optionIconInputs, setOptionIconInputs] = useState<Record<string, string>>({});

  // Sync internal categories state with settings
  useEffect(() => {
    if (settings.customTags && settings.customTags.length > 0) {
      setCategories(settings.customTags);
    } else {
      setCategories(DEFAULT_TAG_CATEGORIES);
    }
  }, [settings.customTags]);

  // JSON copy/paste state
  const [jsonPaste, setJsonPaste] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveAlert, setSaveAlert] = useState(false);

  // Generate database export string
  const exportDataString = JSON.stringify(tasks, null, 2);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      userName: userName.trim(),
      playSounds,
      urgencyNotification,
      customTags: categories.length > 0 ? categories : undefined
    });
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 2500);
  };

  const handleCopyBackup = () => {
    navigator.clipboard.writeText(exportDataString);
    alert('백업 데이터(JSON)가 클립보드에 무사히 복사되었습니다!');
  };

  const handleImport = () => {
    if (!jsonPaste.trim()) return;
    const success = onImportData(jsonPaste.trim());
    if (success) {
      setImportStatus('success');
      setJsonPaste('');
      setTimeout(() => setImportStatus('idle'), 3000);
      alert('백업 데이터가 성공적으로 복구되었습니다!!');
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
      alert('데이터 포맷이 잘못되었습니다. 유효한 JSON 배열 형식인지 확인해주세요.');
    }
  };

  // Custom Category & Options action mechanics
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;
    const newCatId = `cat_${Date.now()}`;
    const newCat: TagCategory = {
      id: newCatId,
      label: `${newCategoryLabel.trim()} (커스텀)`,
      isDefault: false,
      options: []
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    setNewCategoryLabel('');
    
    // Propagate changes persistently
    onSaveSettings({
      ...settings,
      customTags: updated
    });
    alert(`'${newCategoryLabel.trim()}' 태그 카테고리가 새로 소환되었습니다.`);
  };

  const handleDeleteCategory = (catId: string, label: string) => {
    if (confirm(`'${label}' 카테고리를 영구 삭제하시겠습니까? 해당 태깅 분류를 사용 중인 일들의 태그도 자동으로 무효화됩니다.`)) {
      const updated = categories.filter((c) => c.id !== catId);
      setCategories(updated);
      onSaveSettings({
        ...settings,
        customTags: updated
      });
    }
  };

  const handleCreateOption = (catId: string) => {
    const label = optionLabelInputs[catId] || '';
    const icon = optionIconInputs[catId] || '';
    if (!label.trim()) return;

    const optValue = `val_${Date.now()}`;
    const newChoice: TagChoice = {
      value: optValue,
      label: label.trim(),
      icon: icon.trim() || undefined
    };

    const updated = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          options: [...cat.options, newChoice]
        };
      }
      return cat;
    });

    setCategories(updated);
    setOptionLabelInputs(prev => ({ ...prev, [catId]: '' }));
    setOptionIconInputs(prev => ({ ...prev, [catId]: '' }));

    onSaveSettings({
      ...settings,
      customTags: updated
    });
  };

  const handleDeleteOption = (catId: string, optValue: string, optLabel: string) => {
    if (confirm(`'${optLabel}' 분류를 삭제할까요?`)) {
      const updated = categories.map((cat) => {
        if (cat.id === catId) {
          return {
            ...cat,
            options: cat.options.filter((o) => o.value !== optValue)
          };
        }
        return cat;
      });
      setCategories(updated);
      onSaveSettings({
        ...settings,
        customTags: updated
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Basic configuration Form */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000]">
        <h4 className="text-sm font-black text-black mb-4 flex items-center gap-2 uppercase">
          ⚙️ 해야지 시스템 정밀 환경설정
        </h4>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs font-bold text-black">
          <div>
            <label className="text-[11px] font-black text-black block mb-1.5 uppercase">
              실천가 닉네임 설정
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#F4F4F1] border-3 border-black p-3 text-black font-extrabold outline-none focus:bg-white"
              placeholder="당신의 이름을 입력하세요"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F4F4F1] border-3 border-black">
            <div>
              <span className="font-extrabold text-black block">🔊 감금 효과음 극대화</span>
              <span className="text-[10px] text-zinc-700 font-bold">실천 완료, 사투 포기시에 오감을 자극하는 사운드</span>
            </div>
            <input
              type="checkbox"
              checked={playSounds}
              onChange={(e) => setPlaySounds(e.target.checked)}
              className="w-5 h-5 accent-[#FF4D00] border-2 border-black cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F4F4F1] border-3 border-black">
            <div>
              <span className="font-extrabold text-black block">🚨 지연 기류 탐지기 소환</span>
              <span className="text-[10px] text-zinc-700 font-bold">홈 화면 상단에 맹렬한 실천 촉구 스탠드 활성화</span>
            </div>
            <input
              type="checkbox"
              checked={urgencyNotification}
              onChange={(e) => setUrgencyNotification(e.target.checked)}
              className="w-5 h-5 accent-[#FF4D00] border-2 border-black cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF4D00] text-white border-3 border-black font-black py-3 hover:bg-orange-600 shadow-[3px_3px_0px_0px_#000] active:scale-95 transition cursor-pointer text-xs"
          >
            기본 환경 변수 저장하기 💾
          </button>

          {saveAlert && (
            <p className="text-[11px] font-black text-[#1A1A1A] text-center animate-pulse pt-1">
              ✓ 시스템 환경 정보가 실시간 반영되었습니다!
            </p>
          )}
        </form>
      </div>

      {/* 2. Custom Tags Administration Card */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000]">
        <h4 className="text-sm font-black text-black mb-1.5 flex items-center gap-2 uppercase">
          🏷️ 태그 카테고리 & 분류 초정밀 커스터마이즈
        </h4>
        <p className="text-[11px] text-zinc-700 leading-relaxed font-bold mb-5">
          기본 제공되는 네 가지 태그(시점, 성격, 도구, 시간) 내부의 옵션을 지우거나 새 옵션을 추가할 수 있으며, 이외에도 무제한으로 자신만의 태그 카테고리(예: '우선순위', '장소', '감정')를 생성할 수 있습니다.
          <br />
          <span className="text-[#FF4D00]">* 변경 사항은 즉시 태깅 및 검색 필터에 자동으로 실시간 반영됩니다.</span>
        </p>

        {/* 2A. Create new custom category form */}
        <form onSubmit={handleCreateCategory} className="border-3 border-dashed border-zinc-400 p-4 mb-6 bg-[#FFFDF0]">
          <span className="text-xs font-black text-[#FF4D00] flex items-center gap-1 mb-2.5">
            <FolderPlus className="w-4 h-4 stroke-[3]" /> 새 태그 대카테고리 소환하기
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: 우선순위, 공부장소, 협력 파트너 등"
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              className="flex-1 bg-white border-2 border-black py-2 px-3 text-xs text-black font-extrabold outline-none"
            />
            <button
              type="submit"
              disabled={!newCategoryLabel.trim()}
              className="bg-black hover:bg-zinc-800 text-white font-black px-4 py-2 border-2 border-black text-xs shadow-[2px_2px_0px_0px_#FF4D00] transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              카테고리 생성 ➕
            </button>
          </div>
        </form>

        {/* 2B. Map lists of active Categories and editable inner option badges */}
        <div className="space-y-5">
          {categories.map((cat, index) => (
            <div key={cat.id} className="border-3 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] relative">
              
              {/* Category Header Row */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-[12.5px] font-black text-black">
                  📌 {index + 1}. {cat.label}
                  {cat.isDefault && <span className="text-[9px] font-bold bg-[#F4F4F1] border border-zinc-300 text-zinc-650 px-1.5 py-0.5 rounded-none ml-2">시스템 기본 탑재</span>}
                </span>
                {!cat.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.label)}
                    className="text-[10px] text-zinc-550 border border-black hover:bg-rose-100 hover:text-rose-600 bg-white px-2 py-0.5 font-bold transition flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-[#FF4D00]" /> 카테고리 폐기
                  </button>
                )}
              </div>

              {/* Editable inner options visualization */}
              <div className="flex flex-wrap gap-2.5 mb-4 border-b border-zinc-200 pb-3.5">
                {cat.options && cat.options.length > 0 ? (
                  cat.options.map((opt) => (
                    <span 
                      key={opt.value} 
                      className="inline-flex items-center gap-1 text-[11px] font-black bg-[#F4F4F1] text-black border-2 border-black py-1 px-2.5 shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition"
                    >
                      {opt.icon && <span className="filter drop-shadow-[0.5px_0.5px_0_#000]">{opt.icon}</span>}
                      <span>{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(cat.id, opt.value, opt.label)}
                        className="text-[#FF4D00] hover:text-red-700 font-extrabold ml-1.5 text-xs outline-none cursor-pointer focus:scale-110 shrink-0"
                        title="이 분류 삭제"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-500 font-medium italic py-1">
                    아직 이 카테고리에 할당된 세부 하위 분류(옵션)가 존재하지 않습니다.
                  </span>
                )}
              </div>

              {/* Add an option inside this specific category */}
              <div className="space-y-2 bg-[#F4F4F1] p-3 border-2 border-black">
                <span className="text-[10px] font-black text-black block">💡 이 카테고리 안에 세부 하위 선택지 추가하기</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="분류 명칭 (예: 집안, 긴급함, 노트북)"
                    value={optionLabelInputs[cat.id] || ''}
                    onChange={(e) => setOptionLabelInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    className="flex-1 bg-white border-2 border-black py-1 px-2 text-[11px] font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="아이콘 이모지(선택) (예: 💻, 🎒)"
                    value={optionIconInputs[cat.id] || ''}
                    maxLength={2}
                    onChange={(e) => setOptionIconInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    className="w-full sm:w-44 bg-white border-2 border-black py-1 px-2 text-[11px] font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateOption(cat.id)}
                    disabled={!(optionLabelInputs[cat.id] || '').trim()}
                    className="bg-[#fed7aa] hover:bg-orange-200 border-2 border-black px-3.5 py-1 text-[11px] font-black cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000] active:scale-95 disabled:opacity-40 transition shrink-0"
                  >
                    분류 추가 ➕
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 3. Backup / Restore Data Copy Paste */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000]">
        <h4 className="text-sm font-black text-black mb-2 flex items-center gap-2 uppercase">
          <Database className="w-4 h-4 text-[#FF4D00] stroke-[3]" />
          데이터 백업 및 네이티브 로컬 이식기
        </h4>
        <p className="text-[11px] text-zinc-700 mb-4 leading-relaxed font-bold">
          웹 브라우저 내부 레지스트리에 데이터가 기밀 보존되어 있습니다. 백업용 파일로 이송하거나 새로운 네이티브 기기로 이식할 때 사용하세요.
        </p>

        <div className="space-y-4 text-xs font-bold text-black">
          {/* Export section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-black block uppercase">현재 DB 내보내기 (복사 가능)</span>
            <div className="relative">
              <textarea
                readOnly
                value={exportDataString}
                rows={4}
                className="w-full bg-[#F4F4F1] border-3 border-black p-3 text-[10px] font-mono font-bold text-zinc-855 outline-none select-all"
              />
              <button
                onClick={handleCopyBackup}
                className="absolute right-3.5 bottom-4 bg-yellow-300 text-[10px] font-black hover:bg-yellow-400 text-black border-2 border-black px-3.5 py-1.5 shadow-[2px_2px_0px_0px_#000] transition cursor-pointer"
              >
                전체 복사 📋
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="space-y-1.5 border-t border-zinc-200 pt-4">
            <span className="text-[11px] font-black text-black block uppercase">백업 데이터로 복구하기 (가져오기)</span>
            <p className="text-[10px] text-zinc-700 mb-2">백업했던 복제 코드를 아래에 그대로 붙여넣고 버튼을 누르세요.</p>
            <textarea
              placeholder='[ { "id": "task-...", "title": "..." } ] 형식의 백업 데이터를 입력하세요...'
              value={jsonPaste}
              onChange={(e) => setJsonPaste(e.target.value)}
              rows={3}
              className="w-full bg-[#F4F4F1] border-3 border-black p-3 text-[10px] font-mono font-bold text-black outline-none"
            />
            <button
              onClick={handleImport}
              disabled={!jsonPaste.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-white border-3 border-black hover:bg-zinc-100 disabled:opacity-40 text-black py-3 shadow-[3px_3px_0px_0px_#000] transition font-black cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[3]" /> 데이터 복원 수행하기
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dangerous / Diagnostic features */}
      <div className="bg-white border-4 border-black p-5 border-rose-500 shadow-[6px_6px_0px_0px_#000]">
        <h4 className="text-sm font-black text-rose-500 mb-2.5 flex items-center gap-2 uppercase">
          <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
          진단 및 공장 초기화 구역
        </h4>
        
        <div className="space-y-3.5 font-bold text-black">
          <p className="text-[11px] text-zinc-700 leading-relaxed font-bold">
            데이터 수치에 오류가 있거나, 새롭게 시뮬레이션을 돌려보고 싶다면 아래 초기화 프로세스를 구동하십시오.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Reset to Samples */}
            <button
              onClick={() => {
                if (confirm('현재 저장된 모든 자료가 삭제되고 엄선된 3대 미룸 해결 과제(샘플 데이터)로 초기화됩니다. 계속 진행할까요?')) {
                  onResetToSamples();
                  alert('샘플 데이터가 완벽하게 복원 및 이식 완료되었습니다.');
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#fed7aa] border-3 border-black text-black py-3 text-xs font-black shadow-[3px_3px_0px_0px_#000] active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              미룸 샘플 추가하기 (3종 완비)
            </button>

            {/* Clear all */}
            <button
              onClick={() => {
                if (confirm('모든 데이터가 완전히 소멸되며 최초 상태로 기각됩니다. 정말 초기화 하겠습니까?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-200 border-3 border-black text-black py-3 text-xs font-black shadow-[3px_3px_0px_0px_#000] active:scale-95 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              데이터 영구 청소하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
