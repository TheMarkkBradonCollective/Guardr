import React from 'react';
import { X } from 'lucide-react';
import { AppDrawer } from '../ui/motion/AppMotion';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SidebarDrawer({ open, onClose, title, subtitle, children, footer }: SidebarDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      {children}
    </AppDrawer>
  );
}
