import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import {
  LucideAngularModule,
  LayoutDashboard,
  User,
  LogIn,
  LogOut,
  Settings,
  Package,
  Truck,
  Home,
  Menu,
  X,
  Bell,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash,
  Edit,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  MapPin,
  Calendar,
  Wallet,
  Star,
  MessageSquare,
  Shield,
  Briefcase,
  Layers,
  BarChart2,
  Lock,
  Eye,
  EyeOff,
  // Added icons
  Radar, History, ClipboardList, FileText, Navigation, Phone, Mail, Building2, RotateCcw,
  Save, Settings2, LifeBuoy, PhoneCall, MessageCircle, Send, Inbox, RefreshCw, UserPlus,
  Smile, Headset, Zap, ShieldCheck, Tag, Award, Headphones, ShoppingCart, PackageCheck,
  RotateCw, Info, Box, Milestone, ShieldAlert, PenTool, Check, MoreHorizontal, ArrowUpCircle,
  Package2, PhoneForwarded, ExternalLink, Satellite, StickyNote, Sliders, CalendarClock, UserCog,
  CheckCircle2, Map, Layout, Calculator, FileCheck, FileCode, FileInput, Fingerprint, GripHorizontal,
  ArrowUp, ArrowDown, Filter, XCircle, Edit3, SearchX, UploadCloud
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      LayoutDashboard, User, LogIn, LogOut, Settings, Package, Truck, Home, Menu, X, Bell, Search,
      ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Trash, Edit,
      CheckCircle, AlertCircle, HelpCircle, Clock, MapPin, Calendar, Wallet, Star, MessageSquare,
      Shield, Briefcase, Layers, BarChart2, Lock, Eye, EyeOff,
      // Added icons
      Radar, History, ClipboardList, FileText, Navigation, Phone, Mail, Building2, RotateCcw,
      Save, Settings2, LifeBuoy, PhoneCall, MessageCircle, Send, Inbox, RefreshCw, UserPlus,
      Smile, Headset, Zap, ShieldCheck, Tag, Award, Headphones, ShoppingCart, PackageCheck,
      RotateCw, Info, Box, Milestone, ShieldAlert, PenTool, Check, MoreHorizontal, ArrowUpCircle,
      Package2, PhoneForwarded, ExternalLink, Satellite, StickyNote, Sliders, CalendarClock, UserCog,
      CheckCircle2, Map, Layout, Calculator, FileCheck, FileCode, FileInput, Fingerprint, GripHorizontal,
      ArrowUp, ArrowDown, Filter, XCircle, Edit3, SearchX, UploadCloud
    }))
  ]
};
