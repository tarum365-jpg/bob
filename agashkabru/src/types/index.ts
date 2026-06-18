export type ClientStatus = 'active' | 'unpaid' | 'pause' | 'finished';

export type CurrencyCode = 'KZT' | 'USD' | 'RUB';

export type TrainerPhotoSize = 'small' | 'large';

export type ClientPayment = {
  id: string;
  amount: string;
  paidAt: string;
  periodFrom?: string;
  periodTo?: string;
  comment?: string;
};

export type AssignedProgram = {
  id: string;
  planId: string;
  title: string;
  fileName?: string;
  fileUri?: string;
  duration?: string;
  assignedAt: string;
  startDate?: string;
  status: 'active' | 'archived' | 'finished';
  comment?: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  goal: string;
  tariff: string;
  paidAt: string;
  endsAt: string;
  amount: string;
  status: ClientStatus;
  comment: string;
  photoUri?: string;
  payments?: ClientPayment[];
  assignedPlanId?: string;
  assignedPlanHistory?: AssignedProgram[];
};

export type TrainerProfile = {
  appTitle: string;
  trainerName: string;
  sportTitle: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  city?: string;
  shortTitle?: string;
  achievements?: string;
  worldAchievement?: string;
  asiaAchievement?: string;
  currency: CurrencyCode;
  photoUri?: string;
  photoSize?: TrainerPhotoSize;
};

export type PlanCategory =
  | 'Пауэрлифтинг'
  | 'Жим лёжа'
  | 'Сила'
  | 'Здоровье'
  | 'Три базовых упражнения'
  | 'Бодибилдинг'
  | 'Набор массы'
  | 'Похудение'
  | 'Кардио'
  | 'Реабилитация'
  | 'Женский фитнес'
  | 'Общая физическая подготовка'
  | '8 недель'
  | '12 недель'
  | '16 недель'
  | 'Своя категория';

export type PlanTemplate = {
  id: string;
  title: string;
  category: PlanCategory;
  duration: string;
  level: string;
  goal: string;
  fileName: string;
  fileUri: string;
  fileType: string;
  version: string;
  isArchived: boolean;
  createdAt: string;
  comment: string;
};

export type LastBackupInfo = {
  fileUri: string;
  fileName: string;
  createdAt: string;
  sizeLabel: string;
  clientsCount: number;
  templatesCount: number;
};

export type BackupReminder = 'off' | '14days' | 'monthly';
