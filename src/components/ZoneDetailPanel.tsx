import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, MapPin, Mail, Phone, Github, ExternalLink, 
  GraduationCap, Cpu, Award, BookOpen, Send, Lock, Server, Bot, 
  ArrowRight, Shield, Zap, Sparkles, Loader2
} from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { fetchZoneContent, fetchAllZones, Zone } from '../utils/dataHelper';

interface ZoneDetailPanelProps {
  activeZoneId: string;
  language: 'vi' | 'en';
}

export default function ZoneDetailPanel({ activeZoneId, language }: ZoneDetailPanelProps) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch zone contents dynamic according to active 'zone' ID
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    Promise.all([
      fetchZoneContent(activeZoneId),
      fetchAllZones()
    ]).then(([zoneContent, zoneList]) => {
      if (isMounted) {
        setZone(zoneContent);
        setAllZones(zoneList);
        setLoading(false);
      }
    }).catch(err => {
      console.error("Error loading zone content dynamically:", err);
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeZoneId]);

  const getHeaderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <HomeIcon className="text-amber-400" size={24} />;
      case 'GraduationCap': return <GraduationCap className="text-emerald-400" size={24} />;
      case 'Cpu': return <Cpu className="text-blue-400" size={24} />;
      case 'Award': return <Award className="text-purple-400" size={24} />;
      case 'BookOpen': return <BookOpen className="text-indigo-400" size={24} />;
      case 'Send': return <Send className="text-pink-400" size={24} />;
      default: return <Sparkles size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/20 border border-zinc-800 p-6 md:p-8 rounded-3xl h-full min-h-[400px] flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-400" size={28} />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
            {language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading secure resources...'}
          </span>
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="bg-zinc-900/20 border border-zinc-800 p-6 md:p-8 rounded-3xl h-full min-h-[400px] flex flex-col justify-center items-center">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          {language === 'vi' ? 'Không tìm thấy thông tin khu vực' : 'Zone details not found'}
        </span>
      </div>
    );
  }

  // Choose the dynamic dataset based on the current language
  const details = language === 'vi' 
    ? zone.details_vi 
    : (zone.details_en || zone.details_vi || zone.details);

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between">
      <div>
        {/* Detail Header area */}
        <div className="flex items-center gap-4 border-b border-zinc-850 pb-5 mb-6">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800/80 shadow-sm">
            {getHeaderIcon(zone.icon)}
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {language === 'vi' ? 'THÔNG TIN KHU VỰC' : 'ZONE INTEL STATUS'}
            </span>
            <h2 className="text-2xl font-display font-medium text-zinc-100 leading-tight">
              {language === 'vi' ? zone.vietnameseName : zone.name}
            </h2>
          </div>
        </div>

        {/* Dynamic Zone-based content render from the JSON payload */}
        {zone.id === 'home' && details && (
          <div className="space-y-6">
            <div>
              <h3 className="text-3xl font-display font-semibold text-zinc-100 tracking-tight leading-none mb-1">
                {details.fullName}
              </h3>
              <p className="text-md text-emerald-400 font-medium font-mono">
                {details.role}
              </p>
            </div>
            
            <p className="text-zinc-300 font-light leading-relaxed">
              {details.welcomeMessage}
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono text-zinc-500 uppercase">
                {language === 'vi' ? 'THÔNG TIN CƠ BẢN' : 'ESSENTIAL INFO'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {details.basicInfo?.map((info: any, index: number) => (
                  <div key={index} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60 font-sans">
                    <span className="text-zinc-650 block mb-1 font-mono text-[9px] uppercase tracking-wider">{info.label}</span>
                    <span className="text-zinc-300 block font-medium mt-0.5">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 text-xs text-emerald-400 flex gap-3 items-start">
              <Sparkles size={18} className="flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {details.promoMessage}
              </p>
            </div>
          </div>
        )}

        {zone.id === 'academy' && details && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-display font-medium text-emerald-400">{details.institution}</h3>
              <p className="text-sm font-mono text-zinc-500 mt-1">{details.period}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-650 uppercase block mb-1">
                    {language === 'vi' ? 'CHUYÊN NGÀNH CHÍNH' : 'PRIMARY MAJOR'}
                  </span>
                  <p className="text-sm text-zinc-100 font-medium">{details.major}</p>
                  <p className="text-xs text-zinc-400 font-light mt-1">{details.majorDesc}</p>
                </div>
                <GraduationCap className="text-zinc-600" size={24} />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 text-center">
                  <span className="text-zinc-600 block mb-1">
                    {language === 'vi' ? 'GPA TÍCH LŨY' : 'CUMULATIVE GPA'}
                  </span>
                  <span className="text-2xl text-zinc-100 font-bold block mt-1">{details.gpa}</span>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/60 text-center flex flex-col justify-center items-center">
                  <span className="text-zinc-600 block mb-1">
                    {language === 'vi' ? 'HỌC BỔNG' : 'ACADEMIC REWARD'}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold block mt-1">{details.scholarship}</span>
                  <span className="text-[9px] text-zinc-500 block">{details.scholarshipSub}</span>
                </div>
              </div>

              <div className="border border-zinc-855 p-4 rounded-2xl bg-zinc-900/20 text-sm font-light text-zinc-450 leading-relaxed">
                {details.summary}
              </div>
            </div>
          </div>
        )}

        {zone.id === 'lab' && details && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              {details.intro}
            </p>

            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {details.skills?.map((skill: any, index: number) => {
                const getSkillIcon = (cat: string) => {
                  if (cat.includes("Frontend")) return <Shield size={16} className="text-blue-400" />;
                  if (cat.includes("Backend")) return <Server size={16} className="text-blue-400" />;
                  if (cat.includes("Mobile")) return <Bot size={16} className="text-blue-400" />;
                  return <Lock size={16} className="text-blue-400" />;
                };
                return (
                  <div key={index} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                       {getSkillIcon(skill.category)}
                      <h4 className="text-sm font-semibold text-zinc-100">{skill.category}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      {skill.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {zone.id === 'museum' && details && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h3 className="text-lg font-bold text-purple-400 font-display">{details.title}</h3>
              <span className="text-xs font-mono text-zinc-500">{details.period}</span>
            </div>

            <p className="text-[13px] text-emerald-400 font-medium leading-relaxed font-mono">
              {details.highlight}
            </p>

            <a 
              href={details.link} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 rounded-xl border border-purple-500/30"
            >
              {language === 'vi' ? 'Trải Nghiệm Trực Tiếp' : 'Live Interactive Demo'} <ExternalLink size={14} />
            </a>

            <div className="space-y-3 text-xs max-h-[220px] overflow-y-auto pr-1">
              {details.accomplishments?.map((acc: any, index: number) => (
                <div key={index} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
                  <strong className="text-zinc-200 block mb-1.5">{acc.title}</strong>
                  <p className="text-zinc-400 font-light leading-relaxed">{acc.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-purple-400/5 border border-purple-400/20 rounded-2xl p-3.5 text-[11px] text-zinc-300">
              <span className="text-purple-400 font-semibold uppercase block mb-1">{details.resultTitle}</span>
              {details.resultDesc}
            </div>
          </div>
        )}

        {zone.id === 'library' && details && (
          <div className="space-y-6">
            <h3 className="text-md font-mono text-zinc-500 uppercase tracking-widest">{details.filename}</h3>
            
            <div className="space-y-4 font-light text-sm text-zinc-300 leading-relaxed">
              {details.philosophies?.map((phil: any, index: number) => {
                const getPhilIcon = (titleStr: string) => {
                  if (titleStr.includes("AI-Augmented")) return <Zap size={18} className="text-indigo-400 mt-1 flex-shrink-0" />;
                  if (titleStr.includes("Làm Chủ") || titleStr.includes("Ownership")) return <BookOpen size={18} className="text-indigo-400 mt-1 flex-shrink-0" />;
                  return <Sparkles size={18} className="text-indigo-400 mt-1 flex-shrink-0" />;
                };
                return (
                  <div key={index} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 flex gap-3 items-start">
                    {getPhilIcon(phil.title)}
                    <div>
                      <h4 className="font-semibold text-zinc-100 mb-1">{phil.title}</h4>
                      <p className="text-xs text-zinc-400">{phil.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {zone.id === 'portal' && details && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              {details.intro}
            </p>

            <div className="space-y-3 text-xs font-mono">
              {details.contacts?.map((con: any, index: number) => {
                const getContactIcon = (type: string) => {
                  if (type === "Phone") return <Phone size={16} className="text-pink-400" />;
                  if (type === "Mail") return <Mail size={16} className="text-pink-400" />;
                  return <Github size={16} className="text-pink-400" />;
                };
                return (
                  <a 
                    key={index}
                    href={con.url} 
                    className="flex items-center justify-between p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 hover:border-pink-500/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 font-sans">
                      {getContactIcon(con.type)}
                      <span className="text-zinc-400 font-mono text-[11px]">{con.label}</span>
                    </div>
                    <span className="text-zinc-200 group-hover:text-pink-400 transition-colors flex items-center gap-1 font-mono text-[11px]">
                      {con.value} <ArrowRight size={12} />
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 text-xs text-pink-400 leading-relaxed font-mono">
              {details.notice}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA depending on active zone */}
      <div className="mt-8 pt-6 border-t border-zinc-850">
        <span className="text-[10px] font-mono text-zinc-500 block mb-2">
          {language === 'vi' ? 'ĐIỀU HƯỚNG NHANH BẢN ĐỒ' : 'QUICK MAP TELEPORT'}
        </span>
        <div className="flex flex-wrap gap-2">
          {allZones.map((z) => (
            <button
              id={`quick_teleport_${z.id}`}
              key={z.id}
              onClick={() => {
                playClickSound();
                const targetX = z.coords.x + z.size.w / 2;
                const targetY = z.coords.y + z.size.h / 2;
                const clickEvent = new CustomEvent('teleport-player', { detail: { x: targetX, y: targetY } });
                window.dispatchEvent(clickEvent);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                activeZoneId === z.id 
                  ? 'bg-zinc-800 text-white border-zinc-650'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80'
              }`}
            >
              {language === 'vi' ? z.vietnameseName : z.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
