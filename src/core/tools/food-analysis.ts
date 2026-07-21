import type { Tool, ToolResult } from "./types.js";
import { addKnowledge, searchKnowledge } from "../memory/knowledge.js";

interface FoodInfo {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

const foodDB: Record<string, FoodInfo> = {
  // ============ ЯЙЦА ============
  "яйцо": { kcal: 155, protein: 12.7, fat: 11.0, carbs: 0.7 },
  "яйца": { kcal: 155, protein: 12.7, fat: 11.0, carbs: 0.7 },
  "яичница": { kcal: 175, protein: 12.0, fat: 13.5, carbs: 1.0 },
  "яичница глазунья": { kcal: 175, protein: 12.0, fat: 13.5, carbs: 1.0 },
  "яичница-болтунья": { kcal: 170, protein: 11.5, fat: 13.0, carbs: 1.5 },
  "омлет": { kcal: 155, protein: 10.5, fat: 11.5, carbs: 1.5 },
  "омлет с молоком": { kcal: 140, protein: 9.0, fat: 10.0, carbs: 2.5 },
  "омлет с сыром": { kcal: 210, protein: 14.0, fat: 16.0, carbs: 2.0 },
  "омлет с овощами": { kcal: 120, protein: 8.0, fat: 8.0, carbs: 3.5 },
  "яйцо варёное": { kcal: 155, protein: 12.7, fat: 11.0, carbs: 0.7 },
  "яйцо всмятку": { kcal: 155, protein: 12.7, fat: 11.0, carbs: 0.7 },
  "яйцо пашот": { kcal: 155, protein: 12.7, fat: 11.0, carbs: 0.7 },
  "яичный белок": { kcal: 50, protein: 11.0, fat: 0.0, carbs: 0.5 },
  "яичный желток": { kcal: 325, protein: 16.0, fat: 27.0, carbs: 1.5 },
  "яйцо перепелиное": { kcal: 168, protein: 12.0, fat: 13.0, carbs: 0.5 },

  // ============ КАШИ И КРУПЫ ============
  "овсяная каша": { kcal: 88, protein: 3.2, fat: 1.5, carbs: 15.4, fiber: 1.7 },
  "овсянка": { kcal: 88, protein: 3.2, fat: 1.5, carbs: 15.4, fiber: 1.7 },
  "геркулес": { kcal: 88, protein: 3.2, fat: 1.5, carbs: 15.4, fiber: 1.7 },
  "рисовая каша": { kcal: 97, protein: 2.5, fat: 0.3, carbs: 21.3, fiber: 0.4 },
  "гречневая каша": { kcal: 101, protein: 4.2, fat: 1.1, carbs: 18.6, fiber: 2.7 },
  "гречка": { kcal: 101, protein: 4.2, fat: 1.1, carbs: 18.6, fiber: 2.7 },
  "пшенная каша": { kcal: 90, protein: 3.0, fat: 0.8, carbs: 17.0, fiber: 0.7 },
  "манная каша": { kcal: 98, protein: 3.0, fat: 0.5, carbs: 19.5, fiber: 0.2 },
  "манка": { kcal: 98, protein: 3.0, fat: 0.5, carbs: 19.5, fiber: 0.2 },
  "кукурузная каша": { kcal: 86, protein: 2.0, fat: 0.4, carbs: 18.0, fiber: 0.5 },
  "перловая каша": { kcal: 106, protein: 3.1, fat: 0.4, carbs: 22.2, fiber: 1.3 },
  "ячневая каша": { kcal: 96, protein: 2.3, fat: 0.4, carbs: 20.0, fiber: 1.0 },
  "рис": { kcal: 116, protein: 2.4, fat: 0.3, carbs: 25.0, fiber: 0.4 },
  "гречка отварная": { kcal: 101, protein: 4.2, fat: 1.1, carbs: 18.6, fiber: 2.7 },
  "киноа": { kcal: 120, protein: 4.4, fat: 1.9, carbs: 21.3, fiber: 2.8 },
  "булгур": { kcal: 109, protein: 3.1, fat: 0.2, carbs: 24.0, fiber: 4.5 },
  "кус-кус": { kcal: 112, protein: 3.8, fat: 0.2, carbs: 23.2, fiber: 1.4 },
  "чечевица": { kcal: 116, protein: 9.0, fat: 0.4, carbs: 20.0, fiber: 7.9 },
  "нут": { kcal: 139, protein: 8.9, fat: 2.6, carbs: 22.5, fiber: 7.6 },
  "фасоль": { kcal: 127, protein: 8.7, fat: 0.5, carbs: 22.8, fiber: 6.4 },
  "горох": { kcal: 118, protein: 8.0, fat: 0.4, carbs: 20.5, fiber: 5.5 },
  "макароны": { kcal: 131, protein: 5.0, fat: 0.7, carbs: 27.0, fiber: 1.8 },
  "паста": { kcal: 131, protein: 5.0, fat: 0.7, carbs: 27.0, fiber: 1.8 },
  "спагетти": { kcal: 131, protein: 5.0, fat: 0.7, carbs: 27.0, fiber: 1.8 },
  "лапша": { kcal: 138, protein: 4.5, fat: 1.1, carbs: 27.0, fiber: 1.3 },

  // ============ СУПЫ ============
  "суп-пюре овощной": { kcal: 42, protein: 1.5, fat: 1.2, carbs: 6.5, fiber: 2.0 },
  "суп-пюре тыквенный": { kcal: 36, protein: 0.8, fat: 1.0, carbs: 6.0, fiber: 1.8 },
  "суп-пюре морковный": { kcal: 40, protein: 1.0, fat: 1.2, carbs: 6.2, fiber: 1.5 },
  "суп-пюре из брокколи": { kcal: 38, protein: 1.8, fat: 1.0, carbs: 5.0, fiber: 2.2 },
  "куриный суп": { kcal: 55, protein: 4.5, fat: 2.0, carbs: 4.0, fiber: 0.5 },
  "овощной суп": { kcal: 35, protein: 1.2, fat: 0.8, carbs: 5.5, fiber: 1.5 },
  "борщ": { kcal: 49, protein: 2.5, fat: 1.5, carbs: 6.5, fiber: 1.5 },
  "щи": { kcal: 38, protein: 2.0, fat: 1.0, carbs: 5.0, fiber: 1.2 },
  "рассольник": { kcal: 45, protein: 2.0, fat: 1.5, carbs: 5.5, fiber: 0.8 },
  "солянка": { kcal: 68, protein: 4.5, fat: 3.5, carbs: 3.5, fiber: 0.5 },
  "уха": { kcal: 32, protein: 4.0, fat: 1.0, carbs: 2.0, fiber: 0.0 },
  "грибной суп": { kcal: 38, protein: 1.5, fat: 1.2, carbs: 4.5, fiber: 1.0 },
  "сырный суп": { kcal: 85, protein: 4.0, fat: 5.5, carbs: 4.5, fiber: 0.3 },
  "том-ям": { kcal: 48, protein: 3.0, fat: 2.5, carbs: 3.5, fiber: 0.5 },
  "минестроне": { kcal: 39, protein: 1.5, fat: 1.2, carbs: 5.0, fiber: 1.5 },
  "лапша куриная": { kcal: 60, protein: 3.5, fat: 1.8, carbs: 7.0, fiber: 0.5 },
  "суп гороховый": { kcal: 66, protein: 4.0, fat: 1.5, carbs: 9.0, fiber: 2.0 },
  "суп грибной с картофелем": { kcal: 42, protein: 1.2, fat: 1.0, carbs: 6.5, fiber: 1.0 },
  "окрошка": { kcal: 55, protein: 3.0, fat: 2.5, carbs: 5.0, fiber: 0.8 },
  "свекольник": { kcal: 36, protein: 1.2, fat: 1.5, carbs: 4.5, fiber: 1.0 },

  // ============ МЯСО / ПТИЦА ============
  "куриная грудка отварная": { kcal: 165, protein: 31.0, fat: 3.6, carbs: 0.0 },
  "куриная грудка": { kcal: 165, protein: 31.0, fat: 3.6, carbs: 0.0 },
  "куриное филе": { kcal: 165, protein: 31.0, fat: 3.6, carbs: 0.0 },
  "куриное бедро": { kcal: 185, protein: 23.0, fat: 10.0, carbs: 0.0 },
  "куриная ножка": { kcal: 180, protein: 22.0, fat: 10.0, carbs: 0.0 },
  "куриное крыло": { kcal: 200, protein: 22.0, fat: 12.5, carbs: 0.0 },
  "курица жареная": { kcal: 240, protein: 26.0, fat: 15.0, carbs: 0.0 },
  "курица запечённая": { kcal: 200, protein: 28.0, fat: 9.0, carbs: 0.0 },
  "курица варёная": { kcal: 170, protein: 27.0, fat: 6.0, carbs: 0.0 },
  "индейка отварная": { kcal: 150, protein: 30.0, fat: 2.5, carbs: 0.0 },
  "индейка": { kcal: 150, protein: 30.0, fat: 2.5, carbs: 0.0 },
  "индейка тушёная": { kcal: 150, protein: 30.0, fat: 2.5, carbs: 0.0 },
  "индейка запечённая": { kcal: 160, protein: 28.0, fat: 4.0, carbs: 0.0 },
  "говядина отварная": { kcal: 175, protein: 25.0, fat: 7.5, carbs: 0.0 },
  "говядина": { kcal: 175, protein: 25.0, fat: 7.5, carbs: 0.0 },
  "говядина жареная": { kcal: 220, protein: 28.0, fat: 12.0, carbs: 0.0 },
  "говядина тушёная": { kcal: 190, protein: 27.0, fat: 8.5, carbs: 0.0 },
  "стейк": { kcal: 250, protein: 26.0, fat: 16.0, carbs: 0.0 },
  "свинина": { kcal: 259, protein: 16.0, fat: 21.6, carbs: 0.0 },
  "свинина жареная": { kcal: 280, protein: 18.0, fat: 23.0, carbs: 0.0 },
  "свинина тушёная": { kcal: 235, protein: 18.0, fat: 18.0, carbs: 1.0 },
  "свинина отварная": { kcal: 200, protein: 19.0, fat: 14.0, carbs: 0.0 },
  "шашлык из свинины": { kcal: 270, protein: 22.0, fat: 20.0, carbs: 2.0 },
  "шашлык из курицы": { kcal: 150, protein: 25.0, fat: 5.0, carbs: 2.0 },
  "баранина": { kcal: 210, protein: 20.0, fat: 14.0, carbs: 0.0 },
  "кролик": { kcal: 156, protein: 21.0, fat: 8.0, carbs: 0.0 },
  "печень куриная": { kcal: 140, protein: 20.0, fat: 6.0, carbs: 1.5 },
  "печень говяжья": { kcal: 127, protein: 18.0, fat: 3.5, carbs: 5.0 },
  "сердце куриное": { kcal: 160, protein: 16.0, fat: 10.0, carbs: 1.5 },
  "котлеты куриные": { kcal: 130, protein: 18.0, fat: 5.0, carbs: 3.0 },
  "котлеты": { kcal: 200, protein: 14.0, fat: 12.0, carbs: 10.0 },
  "тефтели": { kcal: 175, protein: 15.0, fat: 10.0, carbs: 6.0 },
  "фрикадельки": { kcal: 160, protein: 14.0, fat: 9.0, carbs: 5.0 },
  "фарш куриный": { kcal: 140, protein: 18.0, fat: 7.0, carbs: 0.5 },
  "фарш говяжий": { kcal: 215, protein: 18.0, fat: 16.0, carbs: 0.0 },
   "фарш свиной": { kcal: 270, protein: 15.0, fat: 23.0, carbs: 0.0 },
  "гуляш": { kcal: 180, protein: 18.0, fat: 10.0, carbs: 4.0 },
  "бефстроганов": { kcal: 190, protein: 20.0, fat: 11.0, carbs: 3.0 },
  "плов": { kcal: 195, protein: 12.0, fat: 9.0, carbs: 18.0, fiber: 0.8 },
  "плов с курицей": { kcal: 175, protein: 13.0, fat: 6.0, carbs: 19.0, fiber: 0.8 },

  // ============ КОЛБАСА / ДЕЛИКАТЕСЫ ============
  "колбаса варёная": { kcal: 260, protein: 12.0, fat: 22.0, carbs: 2.5 },
  "докторская колбаса": { kcal: 257, protein: 12.8, fat: 22.2, carbs: 1.5 },
  "колбаса копчёная": { kcal: 400, protein: 16.0, fat: 38.0, carbs: 0.5 },
  "сервелат": { kcal: 420, protein: 16.0, fat: 40.0, carbs: 0.5 },
  "салями": { kcal: 450, protein: 18.0, fat: 42.0, carbs: 1.0 },
  "ветчина": { kcal: 150, protein: 17.0, fat: 8.0, carbs: 2.0 },
  "грудинка": { kcal: 350, protein: 14.0, fat: 33.0, carbs: 0.0 },
  "бекон": { kcal: 540, protein: 12.0, fat: 55.0, carbs: 1.0 },
  "сосиски": { kcal: 260, protein: 11.0, fat: 24.0, carbs: 2.0 },
  "сардельки": { kcal: 280, protein: 12.0, fat: 26.0, carbs: 2.0 },
  "колбаски": { kcal: 300, protein: 13.0, fat: 28.0, carbs: 1.0 },
  "шпикачки": { kcal: 290, protein: 12.0, fat: 27.0, carbs: 2.0 },
  "сарделька": { kcal: 280, protein: 12.0, fat: 26.0, carbs: 2.0 },
  "паштет": { kcal: 320, protein: 12.0, fat: 30.0, carbs: 2.0 },
  "холодец": { kcal: 150, protein: 15.0, fat: 10.0, carbs: 0.5 },
  "студень": { kcal: 130, protein: 14.0, fat: 8.0, carbs: 0.5 },
  "буженина": { kcal: 170, protein: 22.0, fat: 8.0, carbs: 1.0 },
  "карбонат": { kcal: 180, protein: 20.0, fat: 10.0, carbs: 1.0 },
  "корейка": { kcal: 350, protein: 14.0, fat: 33.0, carbs: 0.0 },

  // ============ РЫБА И МОРЕПРОДУКТЫ ============
  "тилапия": { kcal: 96, protein: 20.1, fat: 1.7, carbs: 0.0 },
  "филе тилапии": { kcal: 96, protein: 20.1, fat: 1.7, carbs: 0.0 },
  "телапия": { kcal: 96, protein: 20.1, fat: 1.7, carbs: 0.0 },
  "филе телапии": { kcal: 96, protein: 20.1, fat: 1.7, carbs: 0.0 },
  "треска": { kcal: 82, protein: 18.0, fat: 0.7, carbs: 0.0 },
  "хек": { kcal: 86, protein: 17.0, fat: 1.8, carbs: 0.0 },
  "минтай": { kcal: 72, protein: 16.0, fat: 0.6, carbs: 0.0 },
  "горбуша": { kcal: 140, protein: 21.0, fat: 6.0, carbs: 0.0 },
  "семга": { kcal: 208, protein: 20.0, fat: 14.0, carbs: 0.0 },
  "лосось": { kcal: 208, protein: 20.0, fat: 14.0, carbs: 0.0 },
  "форель": { kcal: 150, protein: 21.0, fat: 7.0, carbs: 0.0 },
  "скумбрия": { kcal: 190, protein: 18.0, fat: 13.0, carbs: 0.0 },
  "сардины": { kcal: 210, protein: 25.0, fat: 11.0, carbs: 0.0 },
  "тунец": { kcal: 130, protein: 28.0, fat: 1.5, carbs: 0.0 },
  "сельдь": { kcal: 160, protein: 16.0, fat: 10.7, carbs: 0.0 },
  "селёдка": { kcal: 160, protein: 16.0, fat: 10.7, carbs: 0.0 },
  "килька": { kcal: 140, protein: 14.0, fat: 9.0, carbs: 0.0 },
  "мойва": { kcal: 157, protein: 14.0, fat: 11.0, carbs: 0.0 },
  "камбала": { kcal: 90, protein: 16.0, fat: 3.0, carbs: 0.0 },
  "палтус": { kcal: 105, protein: 19.0, fat: 3.0, carbs: 0.0 },
  "окунь": { kcal: 95, protein: 19.0, fat: 1.5, carbs: 0.0 },
   "щука": { kcal: 84, protein: 18.0, fat: 1.0, carbs: 0.0 },
   "карп": { kcal: 112, protein: 16.0, fat: 5.0, carbs: 0.0 },
   "судак": { kcal: 84, protein: 18.0, fat: 1.0, carbs: 0.0 },
   "сом": { kcal: 130, protein: 17.0, fat: 7.0, carbs: 0.0 },
  "лосось слабосолёный": { kcal: 200, protein: 21.0, fat: 13.0, carbs: 0.0 },
  "семга слабосолёная": { kcal: 200, protein: 21.0, fat: 13.0, carbs: 0.0 },
  "рыба жареная": { kcal: 170, protein: 22.0, fat: 9.0, carbs: 2.0 },
  "рыба запечённая": { kcal: 110, protein: 20.0, fat: 3.0, carbs: 0.5 },
  "рыба копчёная": { kcal: 150, protein: 22.0, fat: 7.0, carbs: 0.0 },
  "икра красная": { kcal: 250, protein: 26.0, fat: 15.0, carbs: 2.0 },
  "икра чёрная": { kcal: 280, protein: 28.0, fat: 18.0, carbs: 2.0 },
  "кальмар": { kcal: 92, protein: 18.0, fat: 1.5, carbs: 2.0 },
  "креветки": { kcal: 85, protein: 18.0, fat: 1.0, carbs: 1.0 },
  "мидии": { kcal: 75, protein: 12.0, fat: 2.0, carbs: 3.0 },
  "осьминог": { kcal: 82, protein: 15.0, fat: 1.5, carbs: 2.0 },
  "краб": { kcal: 90, protein: 18.0, fat: 1.0, carbs: 1.5 },
  "крабовые палочки": { kcal: 95, protein: 6.0, fat: 2.0, carbs: 14.0 },
  "рыбные консервы": { kcal: 150, protein: 22.0, fat: 7.0, carbs: 0.0 },
  "шпроты": { kcal: 350, protein: 17.0, fat: 32.0, carbs: 0.5 },
  "печень трески": { kcal: 610, protein: 4.0, fat: 66.0, carbs: 1.0 },

  // ============ ОВОЩИ ============
  "картофель": { kcal: 78, protein: 2.0, fat: 0.1, carbs: 16.5, fiber: 1.5 },
  "картошка": { kcal: 78, protein: 2.0, fat: 0.1, carbs: 16.5, fiber: 1.5 },
  "картофель отварной": { kcal: 78, protein: 2.0, fat: 0.1, carbs: 16.5, fiber: 1.5 },
  "картофельное пюре": { kcal: 85, protein: 2.0, fat: 1.5, carbs: 15.0, fiber: 1.2 },
  "пюре": { kcal: 85, protein: 2.0, fat: 1.5, carbs: 15.0, fiber: 1.2 },
  "картофель жареный": { kcal: 180, protein: 3.0, fat: 8.0, carbs: 23.0, fiber: 1.5 },
  "картошка фри": { kcal: 310, protein: 3.5, fat: 17.0, carbs: 36.0, fiber: 2.5 },
  "фри": { kcal: 310, protein: 3.5, fat: 17.0, carbs: 36.0, fiber: 2.5 },
  "картофель запечённый": { kcal: 93, protein: 2.0, fat: 0.5, carbs: 17.0, fiber: 1.8 },
  "капуста белокочанная": { kcal: 28, protein: 1.8, fat: 0.1, carbs: 5.4, fiber: 2.5 },
  "капуста": { kcal: 28, protein: 1.8, fat: 0.1, carbs: 5.4, fiber: 2.5 },
  "капуста тушёная": { kcal: 45, protein: 2.0, fat: 2.0, carbs: 5.0, fiber: 2.5 },
  "капуста цветная": { kcal: 30, protein: 2.0, fat: 0.5, carbs: 4.5, fiber: 2.0 },
  "брокколи": { kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6 },
  "морковь": { kcal: 35, protein: 1.0, fat: 0.1, carbs: 8.0, fiber: 2.0 },
  "свёкла": { kcal: 43, protein: 1.5, fat: 0.1, carbs: 8.8, fiber: 2.0 },
  "лук": { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.0, fiber: 1.7 },
  "огурец": { kcal: 15, protein: 0.7, fat: 0.1, carbs: 3.0, fiber: 0.5 },
  "помидор": { kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  "перец болгарский": { kcal: 26, protein: 1.0, fat: 0.2, carbs: 5.0, fiber: 1.8 },
  "кабачок": { kcal: 24, protein: 0.6, fat: 0.3, carbs: 4.6, fiber: 1.0 },
  "баклажан": { kcal: 25, protein: 1.0, fat: 0.2, carbs: 5.0, fiber: 3.0 },
  "тыква": { kcal: 28, protein: 1.0, fat: 0.1, carbs: 5.5, fiber: 1.5 },
  "зелёный горошек": { kcal: 73, protein: 5.0, fat: 0.2, carbs: 13.0, fiber: 4.0 },
  "кукуруза": { kcal: 105, protein: 3.3, fat: 1.4, carbs: 19.0, fiber: 2.5 },
  "фасоль стручковая": { kcal: 31, protein: 1.8, fat: 0.2, carbs: 5.0, fiber: 2.5 },
  "редис": { kcal: 20, protein: 0.7, fat: 0.1, carbs: 3.4, fiber: 1.6 },
  "репа": { kcal: 28, protein: 1.0, fat: 0.1, carbs: 6.0, fiber: 2.0 },
  "сельдерей": { kcal: 12, protein: 0.9, fat: 0.1, carbs: 2.1, fiber: 1.6 },
  "шпинат": { kcal: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  "щавель": { kcal: 22, protein: 1.5, fat: 0.3, carbs: 3.0, fiber: 1.2 },
  "салат": { kcal: 15, protein: 1.0, fat: 0.2, carbs: 2.5, fiber: 1.5 },
  "руккола": { kcal: 25, protein: 2.6, fat: 0.7, carbs: 3.7, fiber: 1.6 },
  "укроп": { kcal: 40, protein: 2.5, fat: 0.5, carbs: 6.3, fiber: 2.1 },
  "петрушка": { kcal: 36, protein: 3.0, fat: 0.8, carbs: 6.3, fiber: 2.1 },
  "чеснок": { kcal: 150, protein: 6.5, fat: 0.5, carbs: 30.0, fiber: 2.1 },
  "имбирь": { kcal: 80, protein: 1.8, fat: 0.8, carbs: 18.0, fiber: 2.0 },
  "авокадо": { kcal: 212, protein: 2.0, fat: 20.0, carbs: 6.0, fiber: 6.7 },
  "оливки": { kcal: 145, protein: 1.0, fat: 15.0, carbs: 2.0, fiber: 3.0 },
  "маслины": { kcal: 150, protein: 1.5, fat: 16.0, carbs: 1.5, fiber: 3.0 },

  // ============ ФРУКТЫ И ЯГОДЫ ============
  "яблоко": { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14.0, fiber: 2.4 },
  "банан": { kcal: 96, protein: 1.5, fat: 0.2, carbs: 22.0, fiber: 1.5 },
  "апельсин": { kcal: 47, protein: 0.9, fat: 0.1, carbs: 12.0, fiber: 2.4 },
  "мандарин": { kcal: 38, protein: 0.8, fat: 0.2, carbs: 9.0, fiber: 1.8 },
  "лимон": { kcal: 29, protein: 1.1, fat: 0.3, carbs: 9.0, fiber: 2.8 },
  "грейпфрут": { kcal: 35, protein: 0.8, fat: 0.1, carbs: 8.0, fiber: 1.4 },
  "груша": { kcal: 57, protein: 0.4, fat: 0.1, carbs: 15.0, fiber: 2.5 },
  "слива": { kcal: 42, protein: 0.8, fat: 0.3, carbs: 9.6, fiber: 1.5 },
  "персик": { kcal: 39, protein: 0.9, fat: 0.1, carbs: 9.5, fiber: 1.5 },
  "абрикос": { kcal: 44, protein: 0.9, fat: 0.1, carbs: 9.0, fiber: 2.0 },
  "нектарин": { kcal: 44, protein: 1.1, fat: 0.3, carbs: 10.5, fiber: 1.7 },
  "виноград": { kcal: 69, protein: 0.7, fat: 0.2, carbs: 18.0, fiber: 0.9 },
  "арбуз": { kcal: 30, protein: 0.6, fat: 0.2, carbs: 7.5, fiber: 0.4 },
  "дыня": { kcal: 35, protein: 0.8, fat: 0.2, carbs: 8.0, fiber: 1.0 },
  "ананас": { kcal: 50, protein: 0.5, fat: 0.1, carbs: 13.0, fiber: 1.4 },
  "манго": { kcal: 60, protein: 0.8, fat: 0.4, carbs: 15.0, fiber: 1.6 },
  "киви": { kcal: 61, protein: 1.1, fat: 0.5, carbs: 15.0, fiber: 3.0 },
  "хурма": { kcal: 67, protein: 0.5, fat: 0.2, carbs: 16.0, fiber: 3.0 },
  "гранат": { kcal: 56, protein: 0.7, fat: 0.3, carbs: 14.0, fiber: 0.6 },
  "вишня": { kcal: 52, protein: 0.8, fat: 0.2, carbs: 12.0, fiber: 1.6 },
  "черешня": { kcal: 50, protein: 1.0, fat: 0.3, carbs: 11.5, fiber: 1.3 },
  "клубника": { kcal: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2.0 },
  "земляника": { kcal: 30, protein: 0.7, fat: 0.3, carbs: 7.0, fiber: 1.8 },
  "малина": { kcal: 52, protein: 1.2, fat: 0.7, carbs: 12.0, fiber: 6.5 },
  "ежевика": { kcal: 43, protein: 1.4, fat: 0.5, carbs: 9.6, fiber: 5.3 },
  "черника": { kcal: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
  "голубика": { kcal: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
  "клюква": { kcal: 46, protein: 0.4, fat: 0.1, carbs: 12.0, fiber: 3.6 },
  "брусника": { kcal: 46, protein: 0.7, fat: 0.5, carbs: 9.6, fiber: 2.5 },
  "смородина": { kcal: 44, protein: 1.0, fat: 0.4, carbs: 9.0, fiber: 4.5 },
  "крыжовник": { kcal: 45, protein: 0.7, fat: 0.2, carbs: 10.0, fiber: 4.3 },
  "шиповник": { kcal: 110, protein: 1.6, fat: 0.3, carbs: 24.0, fiber: 12.0 },
  "облепиха": { kcal: 82, protein: 1.2, fat: 5.5, carbs: 7.5, fiber: 2.0 },
  "инжир": { kcal: 55, protein: 0.8, fat: 0.2, carbs: 13.0, fiber: 2.5 },
  "финик": { kcal: 282, protein: 2.5, fat: 0.5, carbs: 75.0, fiber: 8.0 },
  "курага": { kcal: 241, protein: 3.4, fat: 0.5, carbs: 62.0, fiber: 7.5 },
  "чернослив": { kcal: 240, protein: 2.3, fat: 0.4, carbs: 63.0, fiber: 7.0 },
  "изюм": { kcal: 290, protein: 2.9, fat: 0.5, carbs: 76.0, fiber: 3.7 },
  "сухофрукты": { kcal: 250, protein: 3.0, fat: 0.5, carbs: 60.0, fiber: 7.0 },
  "орехи": { kcal: 600, protein: 15.0, fat: 55.0, carbs: 15.0, fiber: 7.0 },
  "грецкий орех": { kcal: 650, protein: 15.2, fat: 65.2, carbs: 13.7, fiber: 6.7 },
  "миндаль": { kcal: 575, protein: 21.0, fat: 50.0, carbs: 22.0, fiber: 12.5 },
  "фундук": { kcal: 650, protein: 15.0, fat: 62.0, carbs: 10.0, fiber: 10.0 },
  "кешью": { kcal: 553, protein: 18.0, fat: 44.0, carbs: 30.0, fiber: 3.3 },
  "фисташки": { kcal: 560, protein: 20.0, fat: 45.0, carbs: 28.0, fiber: 10.0 },
  "арахис": { kcal: 567, protein: 26.0, fat: 49.0, carbs: 16.0, fiber: 8.5 },
  "кедровые орехи": { kcal: 673, protein: 14.0, fat: 68.0, carbs: 13.0, fiber: 3.7 },
  "кокос": { kcal: 354, protein: 3.3, fat: 33.5, carbs: 15.0, fiber: 9.0 },
  "семечки": { kcal: 578, protein: 20.7, fat: 52.9, carbs: 3.4, fiber: 4.0 },
  "тыквенные семечки": { kcal: 556, protein: 24.5, fat: 45.8, carbs: 4.7, fiber: 6.0 },
  "лён": { kcal: 534, protein: 18.3, fat: 42.2, carbs: 28.9, fiber: 27.3 },
  "кунжут": { kcal: 565, protein: 19.0, fat: 49.0, carbs: 12.0, fiber: 5.5 },
  "чиа": { kcal: 512, protein: 16.5, fat: 30.7, carbs: 42.1, fiber: 34.0 },

  // ============ МОЛОЧКА ============
  "молоко": { kcal: 60, protein: 3.0, fat: 3.2, carbs: 4.8 },
  "молоко 2.5": { kcal: 55, protein: 3.0, fat: 2.5, carbs: 4.8 },
  "молоко 3.2": { kcal: 60, protein: 3.0, fat: 3.2, carbs: 4.8 },
  "молоко 1.5": { kcal: 44, protein: 3.0, fat: 1.5, carbs: 4.8 },
  "кефир": { kcal: 42, protein: 3.0, fat: 1.0, carbs: 4.0 },
  "кефир 1%": { kcal: 40, protein: 3.0, fat: 1.0, carbs: 4.0 },
  "кефир 2.5%": { kcal: 50, protein: 3.0, fat: 2.5, carbs: 4.0 },
  "кефир 3.2%": { kcal: 56, protein: 3.0, fat: 3.2, carbs: 4.0 },
  "ряженка": { kcal: 55, protein: 3.0, fat: 2.5, carbs: 4.5 },
  "простокваша": { kcal: 50, protein: 3.0, fat: 2.0, carbs: 4.5 },
  "снежок": { kcal: 75, protein: 2.8, fat: 2.5, carbs: 10.0 },
  "йогурт": { kcal: 70, protein: 4.5, fat: 1.5, carbs: 8.5 },
  "йогурт без сахара": { kcal: 55, protein: 4.5, fat: 1.5, carbs: 5.0 },
  "йогурт греческий": { kcal: 65, protein: 6.0, fat: 2.0, carbs: 4.0 },
  "йогурт питьевой": { kcal: 70, protein: 3.5, fat: 2.0, carbs: 10.0 },
  "творог": { kcal: 155, protein: 16.0, fat: 9.0, carbs: 3.0 },
  "творог нежирный": { kcal: 90, protein: 18.0, fat: 0.5, carbs: 3.0 },
  "творог 5%": { kcal: 120, protein: 17.0, fat: 5.0, carbs: 3.0 },
  "творог 9%": { kcal: 155, protein: 16.0, fat: 9.0, carbs: 3.0 },
  "творожная масса": { kcal: 230, protein: 10.0, fat: 12.0, carbs: 22.0 },
   "сырники": { kcal: 200, protein: 14.0, fat: 10.0, carbs: 15.0 },
   "творожная запеканка": { kcal: 130, protein: 14.0, fat: 3.0, carbs: 12.0 },
   "сметана 10%": { kcal: 115, protein: 3.0, fat: 10.0, carbs: 3.0 },
   "сметана 15%": { kcal: 155, protein: 2.8, fat: 15.0, carbs: 3.0 },
   "сметана 20%": { kcal: 205, protein: 2.8, fat: 20.0, carbs: 3.0 },
   "сметана 30%": { kcal: 290, protein: 2.4, fat: 30.0, carbs: 3.0 },
   "сливки 10%": { kcal: 118, protein: 3.0, fat: 10.0, carbs: 4.0 },
    "сливки 33%": { kcal: 330, protein: 2.0, fat: 33.0, carbs: 3.0 },

   // ============ ХЛЕБ / ВЫПЕЧКА ============
  "хлеб": { kcal: 240, protein: 7.5, fat: 1.5, carbs: 48.0, fiber: 2.5 },
  "хлеб белый": { kcal: 240, protein: 7.5, fat: 1.5, carbs: 48.0, fiber: 2.5 },
  "хлеб ржаной": { kcal: 210, protein: 6.5, fat: 1.0, carbs: 42.0, fiber: 5.5 },
  "хлеб чёрный": { kcal: 200, protein: 6.5, fat: 1.0, carbs: 40.0, fiber: 5.0 },
  "хлеб цельнозерновой": { kcal: 220, protein: 8.0, fat: 2.0, carbs: 42.0, fiber: 6.0 },
  "хлеб бородинский": { kcal: 208, protein: 6.9, fat: 1.3, carbs: 41.0, fiber: 5.5 },
  "батон": { kcal: 260, protein: 7.5, fat: 2.5, carbs: 50.0, fiber: 1.5 },
  "булка": { kcal: 260, protein: 7.5, fat: 3.0, carbs: 50.0, fiber: 1.5 },
  "булочка": { kcal: 290, protein: 7.0, fat: 5.0, carbs: 54.0, fiber: 1.5 },
  "багет": { kcal: 270, protein: 8.0, fat: 1.5, carbs: 55.0, fiber: 2.0 },
  "лаваш": { kcal: 240, protein: 8.0, fat: 1.5, carbs: 48.0, fiber: 1.5 },
  "лепёшка": { kcal: 230, protein: 7.0, fat: 2.0, carbs: 47.0, fiber: 2.0 },
  "сухари": { kcal: 330, protein: 10.0, fat: 5.0, carbs: 65.0, fiber: 3.0 },
  "хлебцы": { kcal: 300, protein: 8.0, fat: 2.0, carbs: 60.0, fiber: 7.0 },
  "галеты": { kcal: 380, protein: 8.0, fat: 8.0, carbs: 70.0, fiber: 2.0 },
  "крекер": { kcal: 420, protein: 8.0, fat: 15.0, carbs: 65.0, fiber: 2.0 },
  "блины": { kcal: 130, protein: 5.0, fat: 4.0, carbs: 18.0, fiber: 0.5 },
  "блинчики": { kcal: 130, protein: 5.0, fat: 4.0, carbs: 18.0, fiber: 0.5 },
  "оладьи": { kcal: 180, protein: 5.0, fat: 6.0, carbs: 26.0, fiber: 0.5 },
   "пирожок": { kcal: 250, protein: 6.0, fat: 12.0, carbs: 32.0 },
  "чебурек": { kcal: 280, protein: 8.0, fat: 16.0, carbs: 28.0 },
  "беляш": { kcal: 270, protein: 8.0, fat: 15.0, carbs: 27.0 },
  "пончик": { kcal: 300, protein: 5.0, fat: 18.0, carbs: 32.0 },
  "пицца": { kcal: 250, protein: 11.0, fat: 10.0, carbs: 30.0, fiber: 1.5 },
  "пицца маргарита": { kcal: 220, protein: 10.0, fat: 8.0, carbs: 28.0, fiber: 1.5 },
  "пицца пепперони": { kcal: 280, protein: 12.0, fat: 14.0, carbs: 28.0, fiber: 1.5 },
  "пицца 4 сыра": { kcal: 270, protein: 13.0, fat: 12.0, carbs: 28.0, fiber: 1.5 },
  "пицца гавайская": { kcal: 230, protein: 10.0, fat: 8.0, carbs: 30.0, fiber: 1.5 },

  // ============ ФАСТФУД ============
  "бургер": { kcal: 250, protein: 14.0, fat: 10.0, carbs: 28.0 },
  "гамбургер": { kcal: 250, protein: 14.0, fat: 10.0, carbs: 28.0 },
  "чизбургер": { kcal: 300, protein: 16.0, fat: 14.0, carbs: 30.0 },
  "двойной чизбургер": { kcal: 450, protein: 26.0, fat: 26.0, carbs: 34.0 },
  "биг мак": { kcal: 530, protein: 25.0, fat: 30.0, carbs: 45.0 },
  "макнаггетс": { kcal: 290, protein: 15.0, fat: 18.0, carbs: 16.0 },
  "наггетсы": { kcal: 290, protein: 15.0, fat: 18.0, carbs: 16.0 },
  "картофель фри": { kcal: 310, protein: 3.5, fat: 17.0, carbs: 36.0, fiber: 2.5 },
  "хот-дог": { kcal: 290, protein: 11.0, fat: 16.0, carbs: 26.0 },
  "шаурма": { kcal: 200, protein: 10.0, fat: 10.0, carbs: 18.0 },
  "шаверма": { kcal: 200, protein: 10.0, fat: 10.0, carbs: 18.0 },
  "донер": { kcal: 220, protein: 12.0, fat: 11.0, carbs: 20.0 },
  "самса": { kcal: 250, protein: 8.0, fat: 14.0, carbs: 26.0 },
  "эчпочмак": { kcal: 230, protein: 9.0, fat: 12.0, carbs: 24.0 },
  "круассан": { kcal: 300, protein: 7.0, fat: 17.0, carbs: 32.0 },
  "сэндвич": { kcal: 240, protein: 12.0, fat: 9.0, carbs: 28.0 },
  "суши": { kcal: 40, protein: 2.0, fat: 0.5, carbs: 7.0 },
  "роллы": { kcal: 45, protein: 2.0, fat: 1.0, carbs: 7.0 },
  "ролл филадельфия": { kcal: 50, protein: 2.5, fat: 1.5, carbs: 6.5 },
  "ролл калифорния": { kcal: 40, protein: 2.0, fat: 1.0, carbs: 6.0 },
  "ролл с лососем": { kcal: 45, protein: 2.5, fat: 1.2, carbs: 6.0 },
  "ролл с угрём": { kcal: 55, protein: 2.5, fat: 2.0, carbs: 6.5 },
  "темпура": { kcal: 80, protein: 2.5, fat: 4.0, carbs: 9.0 },
  "роллы запечённые": { kcal: 60, protein: 2.5, fat: 2.0, carbs: 7.5 },

  // ============ ПЕЛЬМЕНИ / ВАРЕНИКИ ============
  "пельмени": { kcal: 220, protein: 11.0, fat: 10.0, carbs: 24.0 },
  "вареники": { kcal: 180, protein: 7.0, fat: 5.0, carbs: 28.0 },
  "вареники с картошкой": { kcal: 160, protein: 5.0, fat: 4.0, carbs: 27.0 },
  "вареники с творогом": { kcal: 200, protein: 10.0, fat: 7.0, carbs: 25.0 },
  "вареники с вишней": { kcal: 175, protein: 5.0, fat: 3.0, carbs: 33.0 },
  "манты": { kcal: 190, protein: 10.0, fat: 8.0, carbs: 21.0 },
  "хинкали": { kcal: 200, protein: 11.0, fat: 9.0, carbs: 22.0 },
  "ленивые вареники": { kcal: 170, protein: 10.0, fat: 5.0, carbs: 22.0 },
  "клёцки": { kcal: 150, protein: 5.0, fat: 4.0, carbs: 25.0 },
  "галушки": { kcal: 160, protein: 5.0, fat: 5.0, carbs: 24.0 },
  "кнедлики": { kcal: 180, protein: 6.0, fat: 6.0, carbs: 26.0 },

  // ============ СЛАДОСТИ / ДЕСЕРТЫ ============
  "шоколад": { kcal: 540, protein: 6.0, fat: 33.0, carbs: 55.0 },
  "шоколад молочный": { kcal: 550, protein: 7.0, fat: 34.0, carbs: 56.0 },
  "шоколад горький": { kcal: 540, protein: 6.0, fat: 32.0, carbs: 55.0, fiber: 8.0 },
  "шоколад белый": { kcal: 560, protein: 6.0, fat: 35.0, carbs: 56.0 },
  "конфеты": { kcal: 450, protein: 3.0, fat: 18.0, carbs: 70.0 },
  "шоколадные конфеты": { kcal: 500, protein: 5.0, fat: 28.0, carbs: 60.0 },
  "карамель": { kcal: 380, protein: 1.0, fat: 4.0, carbs: 85.0 },
  "леденец": { kcal: 380, protein: 0.0, fat: 0.0, carbs: 95.0 },
  "мармелад": { kcal: 320, protein: 0.5, fat: 0.0, carbs: 79.0 },
  "зефир": { kcal: 300, protein: 1.0, fat: 0.1, carbs: 74.0 },
  "пастила": { kcal: 310, protein: 0.5, fat: 0.0, carbs: 76.0 },
  "халва": { kcal: 520, protein: 12.0, fat: 30.0, carbs: 55.0 },
  "козинаки": { kcal: 480, protein: 10.0, fat: 25.0, carbs: 55.0, fiber: 3.0 },
  "нуга": { kcal: 400, protein: 5.0, fat: 12.0, carbs: 72.0 },
  "торт": { kcal: 350, protein: 4.0, fat: 18.0, carbs: 45.0 },
  "пирожное": { kcal: 350, protein: 4.0, fat: 18.0, carbs: 45.0 },
  "эклер": { kcal: 280, protein: 5.0, fat: 16.0, carbs: 30.0 },
  "заварное пирожное": { kcal: 280, protein: 5.0, fat: 16.0, carbs: 30.0 },
  "бисквит": { kcal: 280, protein: 5.0, fat: 8.0, carbs: 48.0 },
  "наполеон": { kcal: 380, protein: 5.0, fat: 22.0, carbs: 42.0 },
  "медовик": { kcal: 350, protein: 5.0, fat: 18.0, carbs: 44.0 },
  "тирамису": { kcal: 350, protein: 6.0, fat: 22.0, carbs: 33.0 },
  "чизкейк": { kcal: 320, protein: 8.0, fat: 22.0, carbs: 25.0 },
  "брауни": { kcal: 420, protein: 5.0, fat: 25.0, carbs: 48.0 },
  "маффин": { kcal: 350, protein: 5.0, fat: 18.0, carbs: 44.0 },
  "кекс": { kcal: 330, protein: 5.0, fat: 15.0, carbs: 46.0 },
  "печенье": { kcal: 450, protein: 7.0, fat: 20.0, carbs: 65.0 },
  "овсяное печенье": { kcal: 420, protein: 8.0, fat: 16.0, carbs: 65.0, fiber: 3.0 },
  "пряник": { kcal: 350, protein: 4.5, fat: 8.0, carbs: 67.0 },
  "вафли": { kcal: 450, protein: 5.0, fat: 22.0, carbs: 60.0 },
  "мороженое": { kcal: 200, protein: 4.0, fat: 12.0, carbs: 22.0 },
  "мороженое пломбир": { kcal: 230, protein: 4.0, fat: 15.0, carbs: 20.0 },
  "мороженое шоколадное": { kcal: 220, protein: 4.0, fat: 14.0, carbs: 22.0 },
  "сорбет": { kcal: 120, protein: 0.5, fat: 0.0, carbs: 30.0 },
  "желе": { kcal: 80, protein: 1.5, fat: 0.0, carbs: 18.0 },
  "пудинг": { kcal: 130, protein: 3.5, fat: 3.0, carbs: 22.0 },
  "суфле": { kcal: 220, protein: 4.0, fat: 12.0, carbs: 26.0 },
  "мёд": { kcal: 328, protein: 0.3, fat: 0.0, carbs: 82.0 },
  "варенье": { kcal: 250, protein: 0.5, fat: 0.1, carbs: 62.0 },
  "джем": { kcal: 250, protein: 0.5, fat: 0.1, carbs: 62.0 },
  "сгущёнка": { kcal: 320, protein: 7.0, fat: 8.5, carbs: 56.0 },
  "сгущённое молоко": { kcal: 320, protein: 7.0, fat: 8.5, carbs: 56.0 },
  "шоколадная паста": { kcal: 540, protein: 6.0, fat: 30.0, carbs: 60.0 },
  "нутелла": { kcal: 540, protein: 6.0, fat: 30.0, carbs: 60.0 },
  "сахар": { kcal: 400, protein: 0.0, fat: 0.0, carbs: 100.0 },

  // ============ НАПИТКИ ============
  "чай": { kcal: 1, protein: 0.0, fat: 0.0, carbs: 0.2 },
  "чай с сахаром": { kcal: 30, protein: 0.0, fat: 0.0, carbs: 7.5 },
  "кофе": { kcal: 2, protein: 0.1, fat: 0.0, carbs: 0.0 },
  "кофе с сахаром": { kcal: 30, protein: 0.1, fat: 0.0, carbs: 7.5 },
  "кофе с молоком": { kcal: 30, protein: 1.5, fat: 1.5, carbs: 2.5 },
  "капучино": { kcal: 50, protein: 2.5, fat: 2.5, carbs: 4.5 },
  "латте": { kcal: 75, protein: 3.0, fat: 4.0, carbs: 7.0 },
  "американо": { kcal: 3, protein: 0.1, fat: 0.0, carbs: 0.2 },
  "эспрессо": { kcal: 2, protein: 0.1, fat: 0.0, carbs: 0.0 },
  "мокко": { kcal: 120, protein: 3.0, fat: 6.0, carbs: 14.0 },
  "раф": { kcal: 130, protein: 3.0, fat: 7.0, carbs: 14.0 },
  "фраппучино": { kcal: 200, protein: 4.0, fat: 8.0, carbs: 28.0 },
  "компот": { kcal: 45, protein: 0.1, fat: 0.0, carbs: 11.0 },
  "кисель": { kcal: 55, protein: 0.2, fat: 0.0, carbs: 13.0 },
  "морс": { kcal: 40, protein: 0.1, fat: 0.0, carbs: 10.0 },
  "квас": { kcal: 27, protein: 0.2, fat: 0.0, carbs: 5.5 },
  "лимонад": { kcal: 40, protein: 0.0, fat: 0.0, carbs: 10.0 },
  "кола": { kcal: 42, protein: 0.0, fat: 0.0, carbs: 10.6 },
  "кока-кола": { kcal: 42, protein: 0.0, fat: 0.0, carbs: 10.6 },
  "пепси": { kcal: 42, protein: 0.0, fat: 0.0, carbs: 10.6 },
  "кола зеро": { kcal: 0.5, protein: 0.0, fat: 0.0, carbs: 0.0 },
  "спрайт": { kcal: 40, protein: 0.0, fat: 0.0, carbs: 10.0 },
  "фанта": { kcal: 45, protein: 0.0, fat: 0.0, carbs: 11.0 },
  "сок": { kcal: 45, protein: 0.5, fat: 0.0, carbs: 10.5 },
  "апельсиновый сок": { kcal: 45, protein: 0.7, fat: 0.2, carbs: 10.4 },
  "яблочный сок": { kcal: 46, protein: 0.1, fat: 0.0, carbs: 11.0 },
  "томатный сок": { kcal: 18, protein: 0.8, fat: 0.1, carbs: 3.5 },
  "мультифрукт": { kcal: 48, protein: 0.3, fat: 0.0, carbs: 11.5 },
   "смузи": { kcal: 70, protein: 2.0, fat: 1.0, carbs: 14.0, fiber: 2.0 },
   "энергетик": { kcal: 48, protein: 0.0, fat: 0.0, carbs: 12.0 },
  "редбулл": { kcal: 46, protein: 0.0, fat: 0.0, carbs: 11.0 },
  "адреналин": { kcal: 48, protein: 0.0, fat: 0.0, carbs: 12.0 },
  "берн": { kcal: 48, protein: 0.0, fat: 0.0, carbs: 12.0 },
  "монстр": { kcal: 50, protein: 0.0, fat: 0.0, carbs: 13.0 },
  "вода": { kcal: 0, protein: 0.0, fat: 0.0, carbs: 0.0 },
  "минералка": { kcal: 0, protein: 0.0, fat: 0.0, carbs: 0.0 },
  "газировка": { kcal: 40, protein: 0.0, fat: 0.0, carbs: 10.0 },
   // ============ АЛКОГОЛЬ ============
  "пиво": { kcal: 43, protein: 0.5, fat: 0.0, carbs: 3.5 },
  "пиво светлое": { kcal: 42, protein: 0.5, fat: 0.0, carbs: 3.5 },
  "пиво тёмное": { kcal: 50, protein: 0.5, fat: 0.0, carbs: 5.0 },
  "вино": { kcal: 85, protein: 0.1, fat: 0.0, carbs: 2.5 },
  "вино белое": { kcal: 82, protein: 0.1, fat: 0.0, carbs: 2.5 },
  "вино красное": { kcal: 85, protein: 0.1, fat: 0.0, carbs: 2.5 },
  "вино сухое": { kcal: 72, protein: 0.1, fat: 0.0, carbs: 1.5 },
  "вино полусухое": { kcal: 78, protein: 0.1, fat: 0.0, carbs: 2.0 },
  "вино полусладкое": { kcal: 85, protein: 0.1, fat: 0.0, carbs: 5.0 },
  "шампанское": { kcal: 76, protein: 0.1, fat: 0.0, carbs: 4.5 },
  "игристое вино": { kcal: 76, protein: 0.1, fat: 0.0, carbs: 4.5 },
  "водка": { kcal: 231, protein: 0.0, fat: 0.0, carbs: 0.1 },
  "коньяк": { kcal: 240, protein: 0.0, fat: 0.0, carbs: 0.5 },
  "виски": { kcal: 235, protein: 0.0, fat: 0.0, carbs: 0.1 },
  "ром": { kcal: 231, protein: 0.0, fat: 0.0, carbs: 0.1 },
  "джин": { kcal: 231, protein: 0.0, fat: 0.0, carbs: 0.0 },
  "текила": { kcal: 231, protein: 0.0, fat: 0.0, carbs: 0.0 },
  "ликёр": { kcal: 300, protein: 0.0, fat: 0.0, carbs: 38.0 },
  "вермут": { kcal: 150, protein: 0.0, fat: 0.0, carbs: 16.0 },
  "наливка": { kcal: 250, protein: 0.0, fat: 0.0, carbs: 30.0 },
  "коктейль": { kcal: 150, protein: 1.0, fat: 2.0, carbs: 18.0 },
  "мохито": { kcal: 75, protein: 0.5, fat: 0.0, carbs: 10.0 },
  "пунш": { kcal: 120, protein: 0.0, fat: 0.0, carbs: 20.0 },

  // ============ СОУСЫ / ЗАПРАВКИ ============
  "майонез": { kcal: 680, protein: 1.5, fat: 72.0, carbs: 3.0 },
  "майонез лёгкий": { kcal: 300, protein: 1.0, fat: 30.0, carbs: 5.0 },
   "кетчуп": { kcal: 110, protein: 1.5, fat: 0.5, carbs: 25.0 },
   "горчица": { kcal: 100, protein: 5.0, fat: 5.0, carbs: 10.0 },
  "соевый соус": { kcal: 55, protein: 6.0, fat: 0.5, carbs: 6.0 },
  "оливковое масло": { kcal: 900, protein: 0.0, fat: 100.0, carbs: 0.0 },
  "подсолнечное масло": { kcal: 900, protein: 0.0, fat: 100.0, carbs: 0.0 },
  "растительное масло": { kcal: 900, protein: 0.0, fat: 100.0, carbs: 0.0 },
  "сливочное масло": { kcal: 748, protein: 0.5, fat: 82.5, carbs: 0.8 },
  "уксус": { kcal: 20, protein: 0.0, fat: 0.0, carbs: 1.0 },
  "лимонный сок": { kcal: 22, protein: 0.1, fat: 0.0, carbs: 7.0 },
  "сметана": { kcal: 160, protein: 2.8, fat: 15.0, carbs: 3.0 },
  "тёртый сыр": { kcal: 350, protein: 25.0, fat: 28.0, carbs: 0.0 },
  "томатная паста": { kcal: 75, protein: 3.5, fat: 0.5, carbs: 15.0 },
  "песто": { kcal: 450, protein: 5.0, fat: 45.0, carbs: 8.0 },
  "табаско": { kcal: 10, protein: 0.5, fat: 0.5, carbs: 1.0 },
  "чесночный соус": { kcal: 350, protein: 1.0, fat: 35.0, carbs: 8.0 },
  "сырный соус": { kcal: 250, protein: 8.0, fat: 20.0, carbs: 8.0 },
  "барбекю": { kcal: 150, protein: 1.0, fat: 4.0, carbs: 30.0 },
  "терияки": { kcal: 90, protein: 2.0, fat: 0.5, carbs: 18.0 },
  "хумус": { kcal: 166, protein: 8.0, fat: 10.0, carbs: 14.0, fiber: 4.0 },
  "гуакамоле": { kcal: 160, protein: 2.0, fat: 15.0, carbs: 9.0, fiber: 7.0 },

  // ============ ЗАКУСКИ / СНЭКИ ============
  "чипсы": { kcal: 540, protein: 5.0, fat: 35.0, carbs: 52.0, fiber: 3.0 },
  "чипсы лейс": { kcal: 540, protein: 5.0, fat: 35.0, carbs: 52.0, fiber: 3.0 },
  "сухарики": { kcal: 370, protein: 8.0, fat: 10.0, carbs: 65.0 },
  "кириешки": { kcal: 370, protein: 8.0, fat: 10.0, carbs: 65.0 },
  "попкорн": { kcal: 380, protein: 8.0, fat: 15.0, carbs: 55.0, fiber: 10.0 },
   "козинак": { kcal: 480, protein: 10.0, fat: 25.0, carbs: 55.0, fiber: 3.0 },
  "батончик мюсли": { kcal: 350, protein: 8.0, fat: 10.0, carbs: 60.0, fiber: 4.0 },
  "шоколадный батончик": { kcal: 450, protein: 5.0, fat: 22.0, carbs: 60.0 },
  "сникерс": { kcal: 450, protein: 7.0, fat: 22.0, carbs: 58.0 },
  "марс": { kcal: 440, protein: 4.0, fat: 18.0, carbs: 68.0 },
  "твикс": { kcal: 470, protein: 5.0, fat: 24.0, carbs: 60.0 },
  "баунти": { kcal: 460, protein: 3.0, fat: 26.0, carbs: 55.0 },
  "милки вэй": { kcal: 460, protein: 4.0, fat: 18.0, carbs: 72.0 },
   // ============ ГОТОВЫЕ БЛЮДА ============
   "салат готовый": { kcal: 80, protein: 4.0, fat: 4.5, carbs: 6.0, fiber: 2.0 },
  "цезарь": { kcal: 180, protein: 12.0, fat: 13.0, carbs: 5.0, fiber: 1.5 },
  "греческий салат": { kcal: 90, protein: 3.5, fat: 6.0, carbs: 4.5, fiber: 1.5 },
  "оливье": { kcal: 180, protein: 7.0, fat: 13.0, carbs: 8.0, fiber: 0.8 },
  "винегрет": { kcal: 90, protein: 2.5, fat: 5.0, carbs: 9.0, fiber: 2.5 },
  "селёдка под шубой": { kcal: 180, protein: 6.0, fat: 14.0, carbs: 8.0, fiber: 1.0 },
  "мимоза": { kcal: 220, protein: 8.0, fat: 18.0, carbs: 5.0 },
  "крабовый салат": { kcal: 150, protein: 7.0, fat: 10.0, carbs: 8.0 },
  "салат с тунцом": { kcal: 120, protein: 14.0, fat: 5.0, carbs: 5.0, fiber: 1.5 },
  "голубцы": { kcal: 120, protein: 8.0, fat: 5.0, carbs: 12.0, fiber: 2.0 },
  "фаршированный перец": { kcal: 110, protein: 7.0, fat: 4.0, carbs: 12.0, fiber: 2.0 },
  "лазанья": { kcal: 160, protein: 10.0, fat: 8.0, carbs: 14.0, fiber: 1.0 },
  "рагу овощное": { kcal: 55, protein: 1.5, fat: 2.0, carbs: 7.0, fiber: 2.5 },
  "жаркое": { kcal: 170, protein: 10.0, fat: 9.0, carbs: 13.0, fiber: 1.5 },
  "картошка по-деревенски": { kcal: 160, protein: 3.0, fat: 7.0, carbs: 22.0, fiber: 2.0 },
  "запеканка": { kcal: 150, protein: 8.0, fat: 6.0, carbs: 16.0 },
  "картофельная запеканка": { kcal: 140, protein: 6.0, fat: 5.0, carbs: 18.0 },
  "макароны по-флотски": { kcal: 180, protein: 9.0, fat: 7.0, carbs: 21.0 },
  "макароны с сыром": { kcal: 180, protein: 7.0, fat: 8.0, carbs: 22.0 },
  "рис с курицей": { kcal: 160, protein: 12.0, fat: 4.0, carbs: 20.0 },
  "гречка с мясом": { kcal: 170, protein: 12.0, fat: 6.0, carbs: 17.0, fiber: 1.5 },
  "куриный бульон": { kcal: 20, protein: 2.5, fat: 1.0, carbs: 0.5 },
  "овсяноблин": { kcal: 120, protein: 8.0, fat: 4.0, carbs: 14.0, fiber: 1.5 },
  "дранники": { kcal: 150, protein: 4.0, fat: 7.0, carbs: 18.0 },
  "тёртый пирог": { kcal: 250, protein: 5.0, fat: 12.0, carbs: 33.0 },
  "шарлотка": { kcal: 180, protein: 4.0, fat: 5.0, carbs: 32.0 },
  "сочник": { kcal: 270, protein: 6.0, fat: 12.0, carbs: 35.0 },
  "ватрушка": { kcal: 250, protein: 8.0, fat: 11.0, carbs: 31.0 },
  "расстегай": { kcal: 230, protein: 8.0, fat: 10.0, carbs: 28.0 },
  "курник": { kcal: 250, protein: 10.0, fat: 12.0, carbs: 27.0 },

  // ============ АЗИАТСКАЯ КУХНЯ ============
  "вок": { kcal: 140, protein: 8.0, fat: 5.0, carbs: 18.0, fiber: 1.5 },
  "лапша вок": { kcal: 140, protein: 8.0, fat: 5.0, carbs: 18.0, fiber: 1.5 },
  "удон": { kcal: 140, protein: 5.0, fat: 1.0, carbs: 28.0 },
  "соба": { kcal: 130, protein: 6.0, fat: 1.0, carbs: 26.0 },
  "фунчоза": { kcal: 95, protein: 0.5, fat: 0.2, carbs: 23.0 },
  "рис жареный": { kcal: 170, protein: 4.0, fat: 5.0, carbs: 28.0 },
  "лапша быстрого приготовления": { kcal: 420, protein: 8.0, fat: 18.0, carbs: 58.0 },
  "доширак": { kcal: 420, protein: 8.0, fat: 18.0, carbs: 58.0 },
  "ролтон": { kcal: 420, protein: 8.0, fat: 18.0, carbs: 58.0 },
  "рамэн": { kcal: 150, protein: 7.0, fat: 5.0, carbs: 20.0 },
  "том ям": { kcal: 48, protein: 3.0, fat: 2.5, carbs: 3.5, fiber: 0.5 },
  "фо-бо": { kcal: 60, protein: 5.0, fat: 1.5, carbs: 7.0 },
  "пад тай": { kcal: 180, protein: 8.0, fat: 8.0, carbs: 22.0 },
  "карри": { kcal: 140, protein: 8.0, fat: 6.0, carbs: 15.0 },
  "курица карри": { kcal: 150, protein: 14.0, fat: 7.0, carbs: 8.0 },
  "кимчи": { kcal: 20, protein: 1.5, fat: 0.5, carbs: 3.0, fiber: 1.5 },
  "мисо": { kcal: 35, protein: 3.0, fat: 1.0, carbs: 4.0 },

  // ============ КОНСЕРВЫ / ПОЛУФАБРИКАТЫ ============
    "тушёнка": { kcal: 220, protein: 15.0, fat: 18.0, carbs: 0.0 },
  "килька в томате": { kcal: 140, protein: 14.0, fat: 5.5, carbs: 7.0 },
  "завтрак туриста": { kcal: 200, protein: 12.0, fat: 15.0, carbs: 5.0 },
  "каша быстрого приготовления": { kcal: 360, protein: 8.0, fat: 5.0, carbs: 75.0 },
  "мюсли": { kcal: 370, protein: 10.0, fat: 7.0, carbs: 70.0, fiber: 6.0 },
  "хлопья кукурузные": { kcal: 363, protein: 7.0, fat: 2.5, carbs: 84.0, fiber: 2.0 },
  "хлопья овсяные": { kcal: 370, protein: 13.0, fat: 6.5, carbs: 64.0, fiber: 10.0 },
  "гранола": { kcal: 400, protein: 10.0, fat: 14.0, carbs: 62.0, fiber: 7.0 },
  "мюсли батончик": { kcal: 350, protein: 8.0, fat: 10.0, carbs: 60.0, fiber: 4.0 },
  "протеиновый батончик": { kcal: 200, protein: 20.0, fat: 6.0, carbs: 22.0, fiber: 3.0 },

  // ============ ЗАМОРОЗКА ============
  "пельмени замороженные": { kcal: 220, protein: 11.0, fat: 10.0, carbs: 24.0 },
  "котлеты замороженные": { kcal: 200, protein: 12.0, fat: 14.0, carbs: 8.0 },
  "наггетсы замороженные": { kcal: 250, protein: 14.0, fat: 16.0, carbs: 14.0 },
  "пицца замороженная": { kcal: 250, protein: 10.0, fat: 10.0, carbs: 30.0 },
  "овощная смесь": { kcal: 45, protein: 2.5, fat: 0.5, carbs: 7.0, fiber: 2.5 },
  "ягоды замороженные": { kcal: 50, protein: 0.7, fat: 0.3, carbs: 11.0, fiber: 3.0 },
  "морепродукты замороженные": { kcal: 85, protein: 15.0, fat: 1.5, carbs: 2.0 },
  "брокколи замороженная": { kcal: 30, protein: 2.5, fat: 0.3, carbs: 5.5, fiber: 2.5 },
  "цветная капуста замороженная": { kcal: 25, protein: 2.0, fat: 0.3, carbs: 4.0, fiber: 2.0 },

  // ============ РЕСТОРАННЫЕ БЛЮДА ============
  "бизнес-ланч": { kcal: 600, protein: 25.0, fat: 22.0, carbs: 75.0 },
  "комбо-обед": { kcal: 800, protein: 30.0, fat: 35.0, carbs: 90.0 },
  "комбо-обед макдоналдс": { kcal: 950, protein: 35.0, fat: 45.0, carbs: 100.0 },
  "бургер кинг": { kcal: 600, protein: 30.0, fat: 35.0, carbs: 45.0 },
  "воппер": { kcal: 650, protein: 32.0, fat: 40.0, carbs: 45.0 },
  "kfc": { kcal: 300, protein: 18.0, fat: 18.0, carbs: 16.0 },
  "kfc ведро": { kcal: 1200, protein: 60.0, fat: 70.0, carbs: 80.0 },
  "стрипсы": { kcal: 270, protein: 18.0, fat: 16.0, carbs: 13.0 },
  "салат kfc": { kcal: 120, protein: 6.0, fat: 7.0, carbs: 8.0 },

  // ============ ДИЕТА №5 / ЛЕЧЕБНОЕ ПИТАНИЕ ============
  "суп-пюре": { kcal: 42, protein: 1.5, fat: 1.2, carbs: 6.5, fiber: 2.0 },
  "каша на воде": { kcal: 80, protein: 2.5, fat: 0.5, carbs: 16.0, fiber: 1.5 },
  "паровая котлета": { kcal: 120, protein: 18.0, fat: 4.0, carbs: 3.0 },
  "рыба на пару": { kcal: 90, protein: 19.0, fat: 1.0, carbs: 0.5 },
  "куриное филе на пару": { kcal: 150, protein: 30.0, fat: 3.0, carbs: 0.0 },
  "творог обезжиренный": { kcal: 90, protein: 18.0, fat: 0.5, carbs: 3.0 },
  "кефир обезжиренный": { kcal: 30, protein: 3.0, fat: 0.1, carbs: 4.0 },
  "овощи тушёные": { kcal: 55, protein: 1.5, fat: 2.0, carbs: 7.0, fiber: 2.5 },
  "салат из свежих овощей": { kcal: 35, protein: 1.5, fat: 0.5, carbs: 6.0, fiber: 2.0 },
  "варёная курица": { kcal: 170, protein: 27.0, fat: 6.0, carbs: 0.0 },
  "печёное яблоко": { kcal: 60, protein: 0.3, fat: 0.2, carbs: 15.0, fiber: 2.0 },
  "кисель овсяный": { kcal: 40, protein: 1.0, fat: 0.5, carbs: 8.0, fiber: 0.5 },
};

const STOP_WORDS = new Set([
  "с","со","из","в","на","и","а","но","от","до","по",
  "под","над","за","у","о","об","без","для","через","про",
  "при","к","ко","во","не","ни","же","бы","ли",
]);

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/ё/g, "е").replace(/[^а-яa-z0-9\s]/g, "").trim();
}

/** Simple character-level similarity (0..1). */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= b.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - matrix[a.length][b.length] / maxLen;
}

function extractWords(s: string): string[] {
  return s.split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function findFood(query: string): { key: string; info: FoodInfo } | null {
  const normalized = normalizeName(query);
  if (!normalized) return null;

  if (foodDB[normalized]) return { key: normalized, info: foodDB[normalized] };

  const qWords = extractWords(normalized);
  if (qWords.length === 0) return null;

  const keys = Object.keys(foodDB);
  let best: { key: string; info: FoodInfo } | null = null;
  let bestScore = 0;

  for (const key of keys) {
    const nk = normalizeName(key);
    if (nk === normalized) return { key, info: foodDB[key] };

    const kWords = extractWords(nk);
    if (kWords.length === 0) continue;

    let score = 0;

    // 1) Exact whole-word matches (highest weight)
    for (const kw of kWords) {
      if (qWords.includes(kw)) score += 15;
    }

    // 2) Key is a substring of query or vice versa — good catch-all
    if (nk.includes(normalized) || normalized.includes(nk)) score += 8;

    // 3) Common prefix match — catches сметана↔сметаной, гречки↔гречка etc
    for (const qw of qWords) {
      for (const kw of kWords) {
        if (kw === qw) continue;
        let common = 0;
        while (common < qw.length && common < kw.length && qw[common] === kw[common]) common++;
        if (common >= 4) {
          score += 4;
          // Bonus for near-identical words (different ending only)
          if (common >= Math.min(qw.length, kw.length) - 1) score += 6;
        }
      }
    }

    // 4) Bonus for first word match (usually the core food)
    if (kWords.length > 0 && qWords.includes(kWords[0])) score += 5;

    if (score > bestScore) {
      bestScore = score;
      best = { key, info: foodDB[key] };
    }
  }

  return bestScore >= 3 ? best : null;
}

function analyzeFood(foodName: string, grams: number): string {
  const found = findFood(foodName);
  if (!found) {
    return `❓ Продукт "${foodName}" не найден в базе (содержит ${Object.keys(foodDB).length} продуктов).\nПопробуй описать точнее или укажи блюдо/продукт по-другому.`;
  }

  const per100 = found.info;
  const ratio = grams / 100;
  const kcal = Math.round(per100.kcal * ratio);
  const protein = Math.round(per100.protein * ratio * 10) / 10;
  const fat = Math.round(per100.fat * ratio * 10) / 10;
  const carbs = Math.round(per100.carbs * ratio * 10) / 10;
  const fiber = per100.fiber ? Math.round(per100.fiber * ratio * 10) / 10 : undefined;

  let result = `🍽️ *${found.key.charAt(0).toUpperCase() + found.key.slice(1)}*\n`;
  result += `Порция: ${grams} г\n\n`;
  result += `📊 Пищевая ценность:\n`;
  result += `🔸 Калории: **${kcal} ккал**\n`;
  result += `🔸 Белки: ${protein} г\n`;
  result += `🔸 Жиры: ${fat} г\n`;
  result += `🔸 Углеводы: ${carbs} г\n`;
  if (fiber !== undefined) result += `🔸 Клетчатка: ${fiber} г\n`;

  return result;
}

function generateDailySummary(meals: Array<{ name: string; grams: number; mealType: string }>): string {
  if (meals.length === 0) return "📋 *Сводка за день*\n\nЗа сегодня приёмов пищи пока не записано.";

  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  const byType: Record<string, typeof meals> = {};

  for (const meal of meals) {
    const found = findFood(meal.name);
    if (!found) continue;
    const ratio = meal.grams / 100;
    totalKcal += found.info.kcal * ratio;
    totalProtein += found.info.protein * ratio;
    totalFat += found.info.fat * ratio;
    totalCarbs += found.info.carbs * ratio;
    const t = meal.mealType || "другое";
    if (!byType[t]) byType[t] = [];
    byType[t].push(meal);
  }

  let result = "📋 *Сводка за день*\n\n";
  for (const [type, items] of Object.entries(byType)) {
    result += `*${type}*:\n`;
    for (const item of items) {
      result += `  • ${item.name} — ${item.grams} г\n`;
    }
  }
  result += `\n🔸 Всего: **${Math.round(totalKcal)} ккал**\n`;
  result += `🔸 Белки: ${Math.round(totalProtein * 10) / 10} г\n`;
  result += `🔸 Жиры: ${Math.round(totalFat * 10) / 10} г\n`;
  result += `🔸 Углеводы: ${Math.round(totalCarbs * 10) / 10} г\n`;

  return result;
}

function generateWeeklySummary(entries: Array<{
  name: string; grams: number; mealType: string; day: string;
}>): string {
  if (entries.length === 0) return "📊 *Сводка за неделю*\n\nЗа последние 7 дней записи отсутствуют.";

  let totalKcal = 0; let totalProtein = 0; let totalFat = 0; let totalCarbs = 0;
  const byDay: Record<string, typeof entries> = {};
  const dayTotals: Record<string, { kcal: number; p: number; f: number; c: number }> = {};

  for (const meal of entries) {
    const found = findFood(meal.name);
    if (!found) continue;
    const ratio = meal.grams / 100;
    const kcal = found.info.kcal * ratio;
    const p = found.info.protein * ratio;
    const f = found.info.fat * ratio;
    const c = found.info.carbs * ratio;
    totalKcal += kcal; totalProtein += p; totalFat += f; totalCarbs += c;
    if (!byDay[meal.day]) byDay[meal.day] = [];
    byDay[meal.day].push(meal);
    if (!dayTotals[meal.day]) dayTotals[meal.day] = { kcal: 0, p: 0, f: 0, c: 0 };
    dayTotals[meal.day].kcal += kcal;
    dayTotals[meal.day].p += p;
    dayTotals[meal.day].f += f;
    dayTotals[meal.day].c += c;
  }

  const days = Object.keys(byDay);
  let result = `📊 *Сводка за неделю*\n\n`;
  result += `📅 ${days[0]} — ${days[days.length - 1]}\n\n`;

  for (const day of days) {
    const t = dayTotals[day];
    result += `*${day}* — ${Math.round(t.kcal)} ккал`;
    const mealsByType: Record<string, string[]> = {};
    for (const m of byDay[day]) {
      if (!mealsByType[m.mealType]) mealsByType[m.mealType] = [];
      mealsByType[m.mealType].push(`${m.name} (${m.grams} г)`);
    }
    for (const [type, items] of Object.entries(mealsByType)) {
      result += `\n  ${type}: ${items.join(", ")}`;
    }
    result += "\n\n";
  }

  const avgKcal = totalKcal / days.length;
  result += `🔸 *Итого за неделю*: **${Math.round(totalKcal)} ккал**\n`;
  result += `🔸 *В среднем в день*: **${Math.round(avgKcal)} ккал**\n`;
  result += `🔸 Белки: ${Math.round(totalProtein * 10) / 10} г\n`;
  result += `🔸 Жиры: ${Math.round(totalFat * 10) / 10} г\n`;
  result += `🔸 Углеводы: ${Math.round(totalCarbs * 10) / 10} г\n`;

  return result;
}

export const foodAnalysisTool: Tool = {
  name: "food_analysis",
  description:
    "Анализирует продукты и блюда, подсчитывает калории и БЖУ. " +
    `База содержит ${Object.keys(foodDB).length}+ продуктов: от диетических до фастфуда. ` +
    "ВАЖНО: указывай ТОЛЬКО короткое название продукта (1-2 слова), а не описание блюда. " +
    "Например, 'салат', а не 'салат из огурцов и помидоров'. " +
    "Доступные действия: analyze — проанализировать продукт/блюдо и получить калории; " +
    "log_meal — записать приём пищи в дневник; " +
    "daily_summary — получить сводку за сегодня; " +
    "weekly_report — получить сводку за последние 7 дней.",
  parameters: [
    {
      name: "action",
      type: "string",
      description: "Действие: analyze (анализ), log_meal (записать приём), daily_summary (сводка за день), weekly_report (сводка за неделю)",
      required: true,
    },
    {
      name: "food_name",
      type: "string",
      description: "Название продукта или блюда (для analyze и log_meal). Указывай коротко: 'гречка', 'борщ', 'салат', 'куриная грудка', 'яблоко'. Без описаний и предлогов!",
    },
    {
      name: "grams",
      type: "number",
      description: "Вес порции в граммах (для analyze и log_meal). По умолчанию 100",
    },
    {
      name: "meal_type",
      type: "string",
      description: "Тип приёма пищи (для log_meal): завтрак, перекус, обед, ужин, перед сном",
    },
  ],

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const action = String(params.action || "").trim();

    switch (action) {
      case "analyze": {
        const foodName = String(params.food_name || "").trim();
        if (!foodName) {
          return { success: false, output: "Укажи название продукта (food_name)", error: "missing_param" };
        }
        const grams = typeof params.grams === "number" && params.grams > 0 ? params.grams : 100;
        const output = analyzeFood(foodName, grams);
        return { success: true, output };
      }

      case "log_meal": {
        const foodName = String(params.food_name || "").trim();
        if (!foodName) {
          return { success: false, output: "Укажи название продукта (food_name)", error: "missing_param" };
        }
        const grams = typeof params.grams === "number" && params.grams > 0 ? params.grams : 100;
        const mealType = String(params.meal_type || "приём пищи").trim();
        const found = findFood(foodName);

        if (!found) {
          // Suggest close matches
          const normalized = foodName.toLowerCase().replace(/ё/g, "е");
          const suggestions = Object.keys(foodDB)
            .map((k) => ({ key: k, score: similarity(normalized, k.toLowerCase().replace(/ё/g, "е")) }))
            .filter((s) => s.score > 0.2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((s) => s.key);
          let msg = `❌ Продукт "${foodName}" не найден в базе (всего ${Object.keys(foodDB).length} продуктов).`;
          if (suggestions.length > 0) {
            msg += `\n\nВозможно, ты имел(а) в виду:\n${suggestions.map((s) => `• ${s}`).join("\n")}`;
          } else {
            msg += `\nПопробуй написать иначе или используй analyze с точным названием.`;
          }
          return { success: false, output: msg, error: "not_found" };
        }

        const logEntry = `[${mealType}] ${found.key} — ${grams} г (${Math.round(found.info.kcal * grams / 100)} ккал)`;
        addKnowledge({
          topic: "meal_log",
          insight: `${logEntry} | Б:${Math.round(found.info.protein * grams / 100 * 10) / 10} Ж:${Math.round(found.info.fat * grams / 100 * 10) / 10} У:${Math.round(found.info.carbs * grams / 100 * 10) / 10}`,
          source: "food_analysis_tool",
        });

        const analysis = analyzeFood(foodName, grams);
        return {
          success: true,
          output: `✅ Записано: ${logEntry}\n\n${analysis}`,
        };
      }

      case "daily_summary": {
        const entries = searchKnowledge("meal_log", 50);
        const meals = entries
          .filter((e) => e.topic === "meal_log")
          .filter((e) => {
            const today = new Date();
            const entryDate = new Date(e.timestamp * 1000);
            return (
              entryDate.getDate() === today.getDate() &&
              entryDate.getMonth() === today.getMonth() &&
              entryDate.getFullYear() === today.getFullYear()
            );
          })
          .map((e) => {
            const match = e.insight.match(/^\[(.+?)\]\s+(.+?)\s+—\s+(\d+)\s+г/);
            if (!match) return null;
            return { name: match[2], grams: parseInt(match[3]), mealType: match[1] };
          })
          .filter((m): m is NonNullable<typeof m> => m !== null);

        return { success: true, output: generateDailySummary(meals) };
      }

      case "weekly_report": {
        const entries = searchKnowledge("meal_log", 100);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dayNames = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
        const meals = entries
          .filter((e) => e.topic === "meal_log")
          .filter((e) => {
            const d = new Date(e.timestamp * 1000);
            return d >= weekAgo && d <= now;
          })
          .map((e) => {
            const d = new Date(e.timestamp * 1000);
            const match = e.insight.match(/^\[(.+?)\]\s+(.+?)\s+—\s+(\d+)\s+г/);
            if (!match) return null;
            return {
              name: match[2],
              grams: parseInt(match[3]),
              mealType: match[1],
              day: `${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`,
            };
          })
          .filter((m): m is NonNullable<typeof m> => m !== null);

        return { success: true, output: generateWeeklySummary(meals) };
      }

      default:
        return {
          success: false,
          output: `Неизвестное действие: ${action}. Используй: analyze, log_meal, daily_summary`,
          error: "invalid_action",
        };
    }
  },
};
