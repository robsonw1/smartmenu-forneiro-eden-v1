import { create } from 'zustand';
import { persist } from 'zustand/middleware';import { supabase } from '@/integrations/supabase/client';
export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface StoreSettings {
  name: string;
  phone: string;
  address: string;
  slogan: string;
  schedule: WeekSchedule;
  isManuallyOpen: boolean; // Manual override for open/closed
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  pickupTimeMin: number;
  pickupTimeMax: number;
  adminPassword: string;
  printnode_printer_id?: string | null;
  print_mode?: string;
  auto_print_pix?: boolean;
  auto_print_card?: boolean;
  auto_print_cash?: boolean;
  orderAlertEnabled?: boolean; // Ativar/desativar som de alerta para novos pedidos
  sendOrderSummaryToWhatsApp?: boolean; // Ativar/desativar envio de resumo para WhatsApp
  enableScheduling?: boolean; // Ativar/desativar agendamento de pedidos
  minScheduleMinutes?: number; // Mínimo de minutos que cliente precisa esperar
  maxScheduleDays?: number; // Máximo de dias que pode agendar
  allowSchedulingOnClosedDays?: boolean; // Permite agendar em dias que loja está fechada
  allowSchedulingOutsideBusinessHours?: boolean; // Permite agendar fora do horário de atendimento
  respectBusinessHoursForScheduling?: boolean; // Se TRUE, só exibe slots dentro do horário
  allowSameDaySchedulingOutsideHours?: boolean; // Se TRUE, permite agendar para HOJE fora do horário
  timezone?: string; // Fuso horário do tenant (ex: America/Sao_Paulo)
}

interface SettingsStore {
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  loadSettingsLocally: (settings: Partial<StoreSettings>) => void; // ✅ SÓ carrega em memória, sem resalvar
  setSetting: (key: keyof StoreSettings, value: any) => void;
  updateDaySchedule: (day: keyof WeekSchedule, schedule: Partial<DaySchedule>) => void;
  toggleManualOpen: () => void;
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  isStoreOpen: () => boolean;
  syncSettingsToSupabase: () => Promise<{ success: boolean; message: string }>;
}

const defaultDaySchedule: DaySchedule = {
  isOpen: true,
  openTime: '18:00',
  closeTime: '23:00',
};

const defaultWeekSchedule: WeekSchedule = {
  monday: { isOpen: false, openTime: '18:00', closeTime: '23:00' },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { isOpen: true, openTime: '17:00', closeTime: '00:00' },
  sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
};

const defaultSettings: StoreSettings = {
  name: 'Forneiro Éden',
  phone: '(11) 99999-9999',
  address: 'Rua das Pizzas, 123 - Centro',
  slogan: 'A Pizza mais recheada da cidade 🇮🇹',
  schedule: defaultWeekSchedule,
  isManuallyOpen: true,
  deliveryTimeMin: 60,
  deliveryTimeMax: 70,
  pickupTimeMin: 40,
  pickupTimeMax: 50,
  adminPassword: 'admin123',
  orderAlertEnabled: true,
  sendOrderSummaryToWhatsApp: false,
  enableScheduling: false,
  minScheduleMinutes: 30,
  maxScheduleDays: 7,
  allowSchedulingOnClosedDays: false,
  allowSchedulingOutsideBusinessHours: false,
  respectBusinessHoursForScheduling: true,
  allowSameDaySchedulingOutsideHours: false,
  timezone: 'America/Sao_Paulo',
};

const dayNames: (keyof WeekSchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
  settings: defaultSettings,

  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    
    // Salvar no Supabase
    try {
      const { settings: currentSettings } = get();
      
      console.log('💾 [UPDATE-SETTINGS] Salvando schedule...');

      // ✅ USAR UPDATE: Atualiza apenas campos necessários
      const { data, error } = await supabase
        .from('settings')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'store-settings');

      if (error) {
        console.error('❌ [UPDATE-SETTINGS] ERRO ao salvar no Supabase:', error);
        throw error;
      }

      console.log('✅ [UPDATE-SETTINGS] Configurações salvas com UPSERT');
    } catch (error) {
      console.error('❌ [UPDATE-SETTINGS] Exceção ao atualizar settings:', error);
      throw error;
    }
  },

  setSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),

  // ✅ NOVO: Carrega settings SÓ em memória, SEM resalvar no Supabase
  loadSettingsLocally: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  updateDaySchedule: (day, schedule) => {
    set((state) => ({
      settings: {
        ...state.settings,
        schedule: {
          ...state.settings.schedule,
          [day]: { ...state.settings.schedule[day], ...schedule },
        },
      },
    }));
    
    // ✅ SINCRONIZAR para Supabase - SEM setTimeout (evitar race conditions)
    (async () => {
      try {
        const { settings: currentSettings } = useSettingsStore.getState();

        console.log('💾 [UPDATE-DAY-SCHEDULE] Salvando schedule COMPLETO para dia:', day);

        // ✅ USAR UPDATE: Atualiza apenas campos necessários
        const { error } = await supabase
          .from('settings')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', 'store-settings');

        if (error) {
          console.error('❌ [UPDATE-DAY-SCHEDULE] Erro ao salvar:', error);
          throw error;
        }

        console.log('✅ [UPDATE-DAY-SCHEDULE] Schedule COMPLETO sincronizado no Supabase para', day);
      } catch (error) {
        console.error('❌ [UPDATE-DAY-SCHEDULE] Erro ao sincronizar schedule:', error);
      }
    })();
  },

  toggleManualOpen: () =>
    set((state) => ({
      settings: { ...state.settings, isManuallyOpen: !state.settings.isManuallyOpen },
    })),

  changePassword: (currentPassword, newPassword) => {
    const { settings } = get();
    if (currentPassword !== settings.adminPassword) {
      return { success: false, message: 'Senha atual incorreta' };
    }
    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter pelo menos 6 caracteres' };
    }
    set((state) => ({
      settings: { ...state.settings, adminPassword: newPassword },
    }));
    return { success: true, message: 'Senha alterada com sucesso!' };
  },

  isStoreOpen: () => {
    const { settings } = get();
    
    const debugInfo = {
      isManuallyOpen: settings.isManuallyOpen,
      scheduleExiste: !!settings.schedule,
      diasDoSchedule: settings.schedule ? Object.keys(settings.schedule) : [],
      horaAtual: new Date().toLocaleTimeString('pt-BR'),
      diaAtual: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
    };
    
    console.log('🔍 [IS-STORE-OPEN] Iniciando verificação:', debugInfo);
    
    // ❌ Se manual close button foi clicado: SEMPRE fechado (sem exceções)
    if (settings.isManuallyOpen === false) {
      console.log('❌ LOJA FECHADA - Botão manual FECHADO pelo gerente');
      return false;
    }

    // ✅ Se manual open button foi clicado: AINDA RESPEITA OS HORÁRIOS CONFIGURADOS
    // O gerente pode abrir manualmente, mas os horários do menu (Seg-Dom) SEMPRE são respeitados
    // Isso garante que nenhum pedido seja feito fora do horário configurado
    
    const now = new Date();
    const currentDay = dayNames[now.getDay()];
    
    console.log('🔍 [IS-STORE-OPEN] Dia atual do sistema:', currentDay);

    const daySchedule = settings.schedule ? settings.schedule[currentDay] : null;

    // Se não tem schedule configurado para hoje
    if (!daySchedule) {
      console.log('❌ LOJA FECHADA - Schedule do dia', currentDay, 'não encontrado no settings.schedule:', {
        schedule: settings.schedule,
        diaRequisitado: currentDay,
      });
      return false;
    }

    console.log(`📅 [IS-STORE-OPEN] Schedule carregado para ${currentDay}:`, daySchedule);

    // ⚠️ CRÍTICO: Verificar se o dia está marcado como FECHADO
    if (daySchedule.isOpen === false) {
      console.log('❌ LOJA FECHADA - Dia', currentDay, 'está marcado como FECHADO (isOpen=false)');
      return false;
    }

    if (!daySchedule.openTime || !daySchedule.closeTime) {
      console.log('❌ LOJA FECHADA - Horários não configurados para hoje:', {
        openTime: daySchedule.openTime,
        closeTime: daySchedule.closeTime,
      });
      return false;
    }

    // ⏰ Calcular hora atual em minutos
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    try {
      const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = daySchedule.closeTime.split(':').map(Number);
      
      const openTime = openHour * 60 + openMinute;
      let closeTime = closeHour * 60 + closeMinute;
      
      console.log('⏰ [IS-STORE-OPEN] Verificando horário:', {
        horaAtual: `${currentHour}:${String(currentMinute).padStart(2, '0')} (${currentTime} min)`,
        horaAbertura: `${daySchedule.openTime} (${openTime} min)`,
        horaFechamento: `${daySchedule.closeTime} (${closeTime} min)`,
      });
      
      // Handle closing time past midnight (e.g., 00:00 means midnight)
      if (closeTime <= openTime) {
        closeTime += 24 * 60; // Add 24 hours
        const adjustedCurrentTime = currentTime < openTime ? currentTime + 24 * 60 : currentTime;
        const isOpen = adjustedCurrentTime >= openTime && adjustedCurrentTime < closeTime;
        console.log('⏰ [IS-STORE-OPEN] Horário com midnight:', isOpen ? `✅ ABERTA (${daySchedule.openTime}-${daySchedule.closeTime})` : `❌ FECHADA (${daySchedule.openTime}-${daySchedule.closeTime}) - Hora atual: ${now.toLocaleTimeString('pt-BR')}`);
        return isOpen;
      }

      const isOpen = currentTime >= openTime && currentTime < closeTime;
      const status = isOpen ? `✅ ABERTA (${daySchedule.openTime}-${daySchedule.closeTime})` : `❌ FECHADA (${daySchedule.openTime}-${daySchedule.closeTime})`;
      console.log('⏰ [IS-STORE-OPEN]', status, '- Hora atual:', now.toLocaleTimeString('pt-BR'));
      return isOpen;
    } catch (error) {
      console.error('Erro ao calcular horário de funcionamento:', error);
      return false;
    }
  },

  syncSettingsToSupabase: async () => {
    try {
      const { settings } = get();

      // ✅ USAR UPDATE: Atualiza apenas campos necessários
      const { error } = await supabase
        .from('settings')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'store-settings');

      if (error) {
        console.error('❌ Erro ao sincronizar settings com Supabase:', error);
        return { success: false, message: 'Erro ao sincronizar configurações' };
      }

      console.log('✅ Settings sincronizados com Supabase via UPSERT');
      return { success: true, message: 'Configurações sincronizadas com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao sincronizar settings:', error);
      return { success: false, message: 'Erro ao sincronizar configurações' };
    }
  },
    }),
    {
      name: 'forneiro-eden-settings',
    }
  )
);
