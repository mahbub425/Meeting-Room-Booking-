export interface Booking {
  id: string;
  meeting_title: string;
  user_id: string;
  room_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  repeat_type: 'no_repeat' | 'daily' | 'weekly' | 'custom';
  remarks: string | null;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  guest_emails: string[] | null;
  is_guest_allowed: boolean;
  serial_number: number | null;
  created_by_pin: string | null;
  approved_by_admin_id: string | null;
  rejection_reason: string | null;
  is_recurring: boolean;
  parent_booking_id: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null; // ISO date string
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number | null;
  facilities: string | null;
  available_time_limit: string | null;
  image_url: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null; // New: Added category_id
}

export interface Profile {
  id: string;
  name: string;
  pin: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  created_at: string;
  updated_at: string;
  role: 'user' | 'admin';
  language: 'English' | 'Bengali';
  time_format: '12-hour' | '24-hour';
  week_start_day: 'Sunday' | 'Monday';
  notification_preference: boolean;
  category_access: string[] | null; // New: Added category_access
  is_enabled: boolean; // New: Added is_enabled
}