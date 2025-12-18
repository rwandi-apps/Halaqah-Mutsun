import { Student } from '../types';

export interface SDQProgressResult {
  current: number;
  target: number;
  percentage: number;
  unit: string; 
  colorClass: string;
  label: string; 
  statusText: string;
  classLevel: number;
}

const SDQ_TARGETS: Record<number, number> = {
  1: 6, 
  2: 1, 
  3: 3, 
  4: 4, 
  5: 5, 
  6: 5  
};

const PAGES_PER_JUZ = 20;
const LINES_PER_PAGE = 15;
const LINES_PER_JUZ = PAGES_PER_JUZ * LINES_PER_PAGE; 

export const extractClassLevel = (input: any): number => {
  if (!input) return 0;
  if (typeof input === 'number') {
    return (input >= 1 && input <= 6) ? input : 0;
  }
  const str = String(input).trim();
  const matchStandard = str.match(/Kelas\s*(\d+)/i);
  if (matchStandard && matchStandard[1]) {
    const level = parseInt(matchStandard[1], 10);
    return (level >= 1 && level <= 6) ? level : 0;
  }
  const matchStart = str.match(/^(\d+)/);
  if (matchStart && matchStart[1]) {
    const level = parseInt(matchStart[1], 10);
    return (level >= 1 && level <= 6) ? level : 0;
  }
  return 0;
};

const getCompletedIqra = (progressStr: string): number => {
  if (!progressStr || progressStr === 'Belum Ada' || progressStr === '-') return 0;
  const lower = progressStr.toLowerCase();
  if (!lower.includes('iqra') && !lower.includes('jilid')) return 6; 
  const match = lower.match(/iqra\s*'?\s*(\d+)/i);
  if (match) return Math.max(0, parseInt(match[1]) - 1);
  return 0;
};

const convertToDecimalJuz = (total: { juz?: number, pages?: number, lines?: number } | undefined): number => {
  if (!total) return 0;
  const juz = Number(total.juz || 0);
  const pages = Number(total.pages || 0);
  const lines = Number(total.lines || 0);
  const decimalValue = juz + (pages / PAGES_PER_JUZ) + (lines / LINES_PER_JUZ);
  return Math.round(decimalValue * 100) / 100;
};

export const calculateSDQProgress = (student: Student): SDQProgressResult => {
  let level = extractClassLevel(student.className);

  if (level === 0) {
    return {
      classLevel: 0,
      target: 0,
      current: 0,
      percentage: 0,
      unit: '-',
      colorClass: "bg-gray-400", 
      statusText: "Kelas Tidak Valid",
      label: "Data Kelas Error"
    };
  }

  const target = SDQ_TARGETS[level] || 1;
  let current = 0;
  let unit = "Juz";

  if (level === 1) {
    unit = "Jilid";
    current = getCompletedIqra(student.currentProgress || "");
  } else {
    unit = "Juz";
    current = convertToDecimalJuz(student.totalHafalan);
  }

  let percentage = Math.round((current / target) * 100);
  let colorClass = "";
  let statusText = "";

  if (percentage >= 100) {
    colorClass = "bg-green-500"; 
    statusText = "Target Tercapai";
  } else if (percentage >= 80) {
    colorClass = "bg-blue-500"; 
    statusText = "Hampir Tercapai";
  } else if (percentage >= 50) {
    colorClass = "bg-orange-500"; 
    statusText = "Perlu Dorongan";
  } else {
    colorClass = "bg-red-500"; 
    statusText = "Perlu Perhatian";
  }

  return {
    classLevel: level,
    target,
    current, 
    unit,
    percentage,
    colorClass,
    statusText,
    label: `${current} dari ${target} ${unit}`
  };
};