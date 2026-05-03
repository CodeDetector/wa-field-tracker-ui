import { MessageSquare, Mail, Building2, Users } from 'lucide-react';

export const NODE_COLORS = {
  Employee: '#6366f1',
  Client:   '#10b981',
  Supplier: '#f59e0b',
  Product:  '#8b5cf6',
  Price:    '#eab308',
  Deadline: '#ef4444',
};

export const NODE_RADIUS = {
  Employee: 22,
  Client:   18,
  Supplier: 18,
  Product:  16,
  Price:    14,
  Deadline: 14,
};

export const CHANNELS = [
  {
    id: 'personal_whatsapp',
    label: 'Personal WhatsApp',
    shortLabel: 'Personal WA',
    icon: MessageSquare,
  },
  {
    id: 'personal_email',
    label: 'Personal Email',
    shortLabel: 'Personal Email',
    icon: Mail,
  },
  {
    id: 'business_whatsapp',
    label: 'Business WhatsApp',
    shortLabel: 'Business WA',
    icon: Building2,
  },
  {
    id: 'business_email',
    label: 'Business Email',
    shortLabel: 'Business Email',
    icon: Mail,
  },
  {
    id: 'business_info',
    label: 'Business Info',
    shortLabel: 'Business Info',
    icon: Users,
  },
];
