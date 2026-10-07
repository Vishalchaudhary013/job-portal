import React from "react";
import {
  AlignLeft,
  Award,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  ChevronDownSquare,
  ChevronsUpDown,
  CircleDot,
  Columns3,
  FileText,
  FolderOpen,
  GalleryHorizontal,
  Globe,
  GraduationCap,
  Hash,
  Image,
  Layers,
  LayoutGrid,
  Link,
  List,
  ListChecks,
  ListTree,
  Mail,
  MapPin,
  MessagesSquare,
  Minus,
  MousePointerClick,
  Newspaper,
  Palette,
  PanelTop,
  Paperclip,
  Phone,
  PilcrowSquare,
  Rows3,
  Sparkles,
  SquareCheck,
  Star,
  Table,
  Tag,
  TextCursorInput,
  Trophy,
  Type,
  Users,
  Video,
} from "lucide-react";

// Explicit name -> component map (importing lucide's full `icons` object would
// pull every icon into the bundle). Covers field types, page blocks and the
// icons admins can pick for content types.
const ICONS = {
  AlignLeft, Award, BookOpen, Boxes, Briefcase, Building2, Calendar, CalendarClock, ChevronDownSquare, ChevronsUpDown,
  CircleDot, Columns3, FileText, FolderOpen, GalleryHorizontal, Globe, GraduationCap, Hash, Image, Layers, LayoutGrid,
  Link, List, ListChecks, ListTree, Mail, MapPin, MessagesSquare, Minus, MousePointerClick, Newspaper, Palette, PanelTop,
  Paperclip, Phone, PilcrowSquare, Rows3, Sparkles, SquareCheck, Star, Table, Tag, TextCursorInput, Trophy, Type, Users, Video,
};

export const CONTENT_TYPE_ICONS = [
  "FileText", "Newspaper", "Briefcase", "GraduationCap", "BookOpen", "Building2", "Users", "Calendar", "MapPin",
  "Award", "Trophy", "Globe", "Tag", "Star", "Sparkles", "Layers", "FolderOpen", "LayoutGrid",
];

const Icon = ({ name, size = 16, className }) => {
  const Component = ICONS[name] || FileText;
  return <Component size={size} className={className} />;
};

export default Icon;
