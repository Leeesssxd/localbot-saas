import { useState } from "react";

// ═══════════════════════════════════════
// DESIGN TOKENS (maps to SCSS variables)
// ═══════════════════════════════════════
const tokens = {
  // Brand
  brand: "#22C55E",
  brandDark: "#16A34A",
  brandLight: "#DCFCE7",
  brandMid: "#86EFAC",
  
  // Neutrals
  ink: "#0D1117",
  inkMid: "#374151",
  inkLight: "#6B7280",
  inkGhost: "#9CA3AF",
  
  // Surfaces
  surfaceBase: "#FFFFFF",
  surfaceRaise: "#FAFAFA",
  surfaceSub: "#F3F4F6",
  surfaceHover: "#F9FAFB",
  
  // Borders
  borderFaint: "rgba(0,0,0,0.06)",
  borderLight: "rgba(0,0,0,0.10)",
  borderMid: "rgba(0,0,0,0.16)",
  
  // Status
  success: "#22C55E",
  successBg: "#F0FDF4",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
};

// ═══════════════════════════════════════
// GLOBAL STYLES (injected as <style>)
// ═══════════════════════════════════════
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  .lb-root {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #0D1117;
    background: #F8F9FB;
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .lb-sidebar {
    width: 232px;
    min-width: 232px;
    background: #FFFFFF;
    border-right: 1px solid rgba(0,0,0,0.07);
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }

  .lb-logo {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lb-logo-mark {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .lb-logo-text {
    font-size: 15px;
    font-weight: 600;
    color: #0D1117;
    letter-spacing: -0.3px;
  }

  .lb-logo-text span {
    color: #22C55E;
  }

  .lb-nav {
    padding: 12px 10px;
    flex: 1;
    overflow-y: auto;
  }

  .lb-nav-section {
    margin-bottom: 20px;
  }

  .lb-nav-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #9CA3AF;
    padding: 0 10px 6px;
  }

  .lb-nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 10px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
    color: #374151;
    font-size: 13.5px;
    font-weight: 450;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    user-select: none;
  }

  .lb-nav-item:hover {
    background: #F3F4F6;
    color: #0D1117;
  }

  .lb-nav-item.active {
    background: #F0FDF4;
    color: #16A34A;
    font-weight: 550;
  }

  .lb-nav-item.active .lb-nav-icon {
    color: #22C55E;
  }

  .lb-nav-icon {
    font-size: 16px;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    color: #6B7280;
  }

  .lb-nav-badge {
    margin-left: auto;
    background: #22C55E;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }

  .lb-sidebar-footer {
    padding: 12px 10px;
    border-top: 1px solid rgba(0,0,0,0.06);
  }

  .lb-business-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s;
  }

  .lb-business-card:hover {
    background: #F3F4F6;
  }

  .lb-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .lb-avatar-green {
    background: #DCFCE7;
    color: #16A34A;
  }

  .lb-avatar-blue {
    background: #DBEAFE;
    color: #1D4ED8;
  }

  .lb-avatar-purple {
    background: #EDE9FE;
    color: #7C3AED;
  }

  .lb-business-name {
    font-size: 13px;
    font-weight: 550;
    color: #0D1117;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lb-business-plan {
    font-size: 11px;
    color: #6B7280;
  }

  /* ── Main content ── */
  .lb-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .lb-topbar {
    height: 56px;
    min-height: 56px;
    background: #FFFFFF;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 12px;
  }

  .lb-topbar-title {
    font-size: 15px;
    font-weight: 600;
    color: #0D1117;
    letter-spacing: -0.2px;
  }

  .lb-topbar-sub {
    font-size: 13px;
    color: #6B7280;
    margin-left: 4px;
  }

  .lb-topbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lb-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
    border: none;
    font-family: inherit;
    white-space: nowrap;
  }

  .lb-btn-primary {
    background: #22C55E;
    color: white;
  }

  .lb-btn-primary:hover {
    background: #16A34A;
  }

  .lb-btn-ghost {
    background: transparent;
    color: #374151;
    border: 1px solid rgba(0,0,0,0.12);
  }

  .lb-btn-ghost:hover {
    background: #F3F4F6;
    border-color: rgba(0,0,0,0.18);
  }

  .lb-btn-danger-ghost {
    background: transparent;
    color: #DC2626;
    border: 1px solid rgba(220,38,38,0.2);
  }

  .lb-btn-danger-ghost:hover {
    background: #FEF2F2;
  }

  .lb-btn-icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    background: transparent;
    border: 1px solid rgba(0,0,0,0.10);
    color: #374151;
    cursor: pointer;
    transition: all 0.12s;
    font-size: 16px;
    font-family: inherit;
  }

  .lb-btn-icon:hover {
    background: #F3F4F6;
  }

  .lb-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  /* ── Cards ── */
  .lb-card {
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 12px;
    overflow: hidden;
  }

  .lb-card-pad {
    padding: 20px;
  }

  .lb-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lb-card-title {
    font-size: 14px;
    font-weight: 600;
    color: #0D1117;
  }

  .lb-card-sub {
    font-size: 12.5px;
    color: #6B7280;
    margin-top: 1px;
  }

  /* ── Stats ── */
  .lb-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .lb-stat {
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 12px;
    padding: 18px 20px;
  }

  .lb-stat-label {
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 8px;
  }

  .lb-stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #0D1117;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .lb-stat-delta {
    font-size: 12px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .lb-delta-up { color: #16A34A; }
  .lb-delta-neutral { color: #6B7280; }

  /* ── Status pill ── */
  .lb-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .lb-pill-green { background: #DCFCE7; color: #15803D; }
  .lb-pill-yellow { background: #FEF9C3; color: #A16207; }
  .lb-pill-red { background: #FEE2E2; color: #B91C1C; }
  .lb-pill-blue { background: #DBEAFE; color: #1D4ED8; }
  .lb-pill-gray { background: #F3F4F6; color: #374151; }
  .lb-pill-purple { background: #EDE9FE; color: #6D28D9; }

  .lb-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  /* ── Trial banner ── */
  .lb-trial-banner {
    background: #FFFBEB;
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 13px;
  }

  .lb-trial-icon {
    width: 28px;
    height: 28px;
    background: #FEF3C7;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D97706;
    flex-shrink: 0;
  }

  .lb-trial-text { color: #92400E; }
  .lb-trial-text strong { color: #78350F; }

  .lb-trial-cta {
    margin-left: auto;
    padding: 5px 12px;
    background: #F59E0B;
    color: white;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Toggle ── */
  .lb-toggle-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: #F0FDF4;
    border-radius: 10px;
    margin-bottom: 20px;
    border: 1px solid rgba(34,197,94,0.15);
  }

  .lb-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .lb-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }

  .lb-toggle-track {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: #D1D5DB;
    cursor: pointer;
    transition: background 0.2s;
  }

  .lb-toggle input:checked + .lb-toggle-track {
    background: #22C55E;
  }

  .lb-toggle-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }

  .lb-toggle input:checked + .lb-toggle-track::after {
    transform: translateX(20px);
  }

  .lb-toggle-label {
    font-size: 14px;
    font-weight: 500;
    color: #0D1117;
  }

  .lb-toggle-sub {
    font-size: 12.5px;
    color: #6B7280;
    margin-left: 2px;
  }

  .lb-toggle-status {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: #16A34A;
  }

  /* ── Grid layouts ── */
  .lb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .lb-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .lb-flex { display: flex; gap: 16px; }
  .lb-flex-1 { flex: 1; min-width: 0; }
  .lb-mb-4 { margin-bottom: 4px; }
  .lb-mb-8 { margin-bottom: 8px; }
  .lb-mb-12 { margin-bottom: 12px; }
  .lb-mb-16 { margin-bottom: 16px; }
  .lb-mb-20 { margin-bottom: 20px; }
  .lb-mb-24 { margin-bottom: 24px; }

  /* ── Appointment item ── */
  .lb-appt {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    transition: background 0.1s;
    cursor: pointer;
  }

  .lb-appt:last-child { border-bottom: none; }
  .lb-appt:hover { background: #FAFAFA; }

  .lb-appt-time {
    width: 52px;
    flex-shrink: 0;
    text-align: right;
  }

  .lb-appt-time-main {
    font-size: 13px;
    font-weight: 600;
    color: #0D1117;
  }

  .lb-appt-time-ampm {
    font-size: 11px;
    color: #9CA3AF;
  }

  .lb-appt-bar {
    width: 3px;
    height: 36px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .lb-appt-name {
    font-size: 13.5px;
    font-weight: 550;
    color: #0D1117;
  }

  .lb-appt-service {
    font-size: 12px;
    color: #6B7280;
    margin-top: 1px;
  }

  .lb-appt-actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.1s;
  }

  .lb-appt:hover .lb-appt-actions { opacity: 1; }

  /* ── Conversation item ── */
  .lb-conv {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    transition: background 0.1s;
  }

  .lb-conv:hover { background: #FAFAFA; }
  .lb-conv.active { background: #F0FDF4; }

  .lb-conv-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .lb-conv-name {
    font-size: 13.5px;
    font-weight: 600;
    color: #0D1117;
  }

  .lb-conv-preview {
    font-size: 12.5px;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    margin-top: 2px;
  }

  .lb-conv-meta {
    margin-left: auto;
    text-align: right;
    flex-shrink: 0;
  }

  .lb-conv-time {
    font-size: 11.5px;
    color: #9CA3AF;
  }

  .lb-unread {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #22C55E;
    color: white;
    font-size: 10.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
    margin-left: auto;
  }

  /* ── Chat area ── */
  .lb-chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .lb-bubble {
    max-width: 72%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.5;
  }

  .lb-bubble-in {
    background: #F3F4F6;
    color: #0D1117;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
  }

  .lb-bubble-out {
    background: #22C55E;
    color: white;
    border-bottom-right-radius: 4px;
    align-self: flex-end;
  }

  .lb-bubble-time {
    font-size: 11px;
    color: #9CA3AF;
    text-align: center;
    align-self: center;
  }

  /* ── Client row ── */
  .lb-client-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    transition: background 0.1s;
  }

  .lb-client-row:hover { background: #FAFAFA; }
  .lb-client-row:last-child { border-bottom: none; }

  .lb-client-name {
    font-size: 13.5px;
    font-weight: 550;
    color: #0D1117;
  }

  .lb-client-phone {
    font-size: 12px;
    color: #6B7280;
  }

  /* ── Service item ── */
  .lb-service {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .lb-service:last-child { border-bottom: none; }

  .lb-service-color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lb-service-name {
    font-size: 13.5px;
    font-weight: 550;
    color: #0D1117;
  }

  .lb-service-meta {
    font-size: 12px;
    color: #6B7280;
    margin-top: 1px;
  }

  .lb-service-price {
    margin-left: auto;
    font-size: 14px;
    font-weight: 600;
    color: #0D1117;
  }

  /* ── Form ── */
  .lb-form-group {
    margin-bottom: 16px;
  }

  .lb-label {
    display: block;
    font-size: 12.5px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 5px;
  }

  .lb-input {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(0,0,0,0.14);
    border-radius: 7px;
    font-size: 13.5px;
    font-family: inherit;
    color: #0D1117;
    background: white;
    outline: none;
    transition: border-color 0.12s;
  }

  .lb-input:focus {
    border-color: #22C55E;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
  }

  .lb-select {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(0,0,0,0.14);
    border-radius: 7px;
    font-size: 13.5px;
    font-family: inherit;
    color: #0D1117;
    background: white;
    outline: none;
    appearance: none;
    cursor: pointer;
  }

  /* ── Admin table ── */
  .lb-table {
    width: 100%;
    border-collapse: collapse;
  }

  .lb-table th {
    padding: 10px 16px;
    text-align: left;
    font-size: 11.5px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    background: #FAFAFA;
    white-space: nowrap;
  }

  .lb-table td {
    padding: 12px 16px;
    font-size: 13px;
    color: #374151;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .lb-table tr:last-child td { border-bottom: none; }

  .lb-table tr:hover td { background: #FAFAFA; }

  /* ── Day schedule grid ── */
  .lb-schedule-day {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .lb-schedule-day:last-child { border-bottom: none; }

  .lb-day-name {
    width: 90px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  /* ── Scrollbar ── */
  .lb-content::-webkit-scrollbar,
  .lb-nav::-webkit-scrollbar,
  .lb-chat-area::-webkit-scrollbar { width: 4px; }
  .lb-content::-webkit-scrollbar-track,
  .lb-nav::-webkit-scrollbar-track,
  .lb-chat-area::-webkit-scrollbar-track { background: transparent; }
  .lb-content::-webkit-scrollbar-thumb,
  .lb-nav::-webkit-scrollbar-thumb,
  .lb-chat-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

  /* ── Mini calendar ── */
  .lb-mini-cal {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    padding: 16px 20px 20px;
  }

  .lb-cal-header {
    font-size: 10.5px;
    font-weight: 600;
    color: #9CA3AF;
    text-align: center;
    padding: 4px 0;
    text-transform: uppercase;
  }

  .lb-cal-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 12.5px;
    color: #374151;
    cursor: pointer;
    transition: background 0.1s;
  }

  .lb-cal-day:hover { background: #F3F4F6; }
  .lb-cal-day.today { background: #22C55E; color: white; font-weight: 600; }
  .lb-cal-day.has-appt { position: relative; }
  .lb-cal-day.has-appt::after {
    content: '';
    position: absolute;
    bottom: 2px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #22C55E;
  }
  .lb-cal-day.today::after { background: white; }
  .lb-cal-day.other-month { color: #D1D5DB; }

  /* ── Metric mini chart ── */
  .lb-sparkline {
    height: 32px;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    margin-top: 8px;
  }

  .lb-spark-bar {
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: #DCFCE7;
    transition: background 0.1s;
  }

  .lb-spark-bar.peak { background: #22C55E; }

  /* ── Admin overview ── */
  .lb-admin-stat {
    background: white;
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 12px;
    padding: 20px;
  }

  .lb-admin-stat-n {
    font-size: 32px;
    font-weight: 600;
    color: #0D1117;
    letter-spacing: -0.8px;
    line-height: 1;
    margin-bottom: 4px;
  }

  .lb-admin-stat-l {
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  /* ── Page tabs ── */
  .lb-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    margin-bottom: 20px;
    padding: 0 4px;
  }

  .lb-tab {
    padding: 10px 16px;
    font-size: 13.5px;
    font-weight: 500;
    color: #6B7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.12s;
    border-top: none;
    border-left: none;
    border-right: none;
    background: transparent;
    font-family: inherit;
  }

  .lb-tab:hover { color: #374151; }
  .lb-tab.active { color: #22C55E; border-bottom-color: #22C55E; }

  /* ── Activity feed ── */
  .lb-activity {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0,0,0,0.04);
  }

  .lb-activity:last-child { border-bottom: none; }

  .lb-activity-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .lb-activity-text {
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
  }

  .lb-activity-time {
    font-size: 11.5px;
    color: #9CA3AF;
    margin-top: 2px;
  }

  /* ── Empty state ── */
  .lb-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    text-align: center;
  }

  .lb-empty-icon {
    font-size: 32px;
    color: #D1D5DB;
    margin-bottom: 12px;
  }

  .lb-empty-title {
    font-size: 14px;
    font-weight: 550;
    color: #374151;
    margin-bottom: 6px;
  }

  .lb-empty-sub {
    font-size: 13px;
    color: #9CA3AF;
    max-width: 280px;
  }

  /* ── Screen selector (demo only) ── */
  .lb-demo-bar {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(13,17,23,0.92);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 8px 12px;
    display: flex;
    gap: 4px;
    z-index: 100;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .lb-demo-btn {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    border: none;
    background: transparent;
    font-family: inherit;
    transition: all 0.12s;
    white-space: nowrap;
  }

  .lb-demo-btn.active {
    background: rgba(255,255,255,0.12);
    color: white;
  }

  .lb-demo-btn:hover {
    color: rgba(255,255,255,0.85);
  }
`;

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
const appointments = [
  { time: "9:00", ampm: "AM", name: "Carlos Mendoza", service: "Corte clásico", duration: 30, color: "#22C55E", status: "confirmed" },
  { time: "9:45", ampm: "AM", name: "Roberto Silva", service: "Corte + barba", duration: 45, color: "#3B82F6", status: "confirmed" },
  { time: "11:00", ampm: "AM", name: "Miguel Torres", service: "Corte premium", duration: 30, color: "#22C55E", status: "confirmed" },
  { time: "12:30", ampm: "PM", name: "Alejandro Ruiz", service: "Barba profesional", duration: 30, color: "#8B5CF6", status: "confirmed" },
  { time: "2:00", ampm: "PM", name: "Juan García", service: "Corte clásico", duration: 30, color: "#22C55E", status: "pending" },
  { time: "3:15", ampm: "PM", name: "Pedro López", service: "Corte + barba", duration: 45, color: "#3B82F6", status: "confirmed" },
  { time: "4:30", ampm: "PM", name: "Marco Díaz", service: "Diseño de barba", duration: 30, color: "#F59E0B", status: "confirmed" },
];

const conversations = [
  { name: "Carlos M.", preview: "Perfecto, nos vemos el martes a las 9", time: "Ahora", unread: 0, initials: "CM", bg: "#DCFCE7", fg: "#16A34A", lastMsg: "bot" },
  { name: "Sofía R.", preview: "¿Tienen lugar para mañana?", time: "2 min", unread: 2, initials: "SR", bg: "#DBEAFE", fg: "#1D4ED8", lastMsg: "client" },
  { name: "Miguel T.", preview: "Gracias, ya quedó confirmado", time: "18 min", unread: 0, initials: "MT", bg: "#EDE9FE", fg: "#7C3AED", lastMsg: "bot" },
  { name: "Ana Flores", preview: "¿A qué hora abre?", time: "1 hr", unread: 1, initials: "AF", bg: "#FEF3C7", fg: "#D97706", lastMsg: "client" },
  { name: "Roberto S.", preview: "Cancelé mi cita de mañana", time: "2 hr", unread: 0, initials: "RS", bg: "#FEE2E2", fg: "#DC2626", lastMsg: "client" },
  { name: "Pedro L.", preview: "¿Cuánto cuesta el corte + barba?", time: "3 hr", unread: 0, initials: "PL", bg: "#F0FDF4", fg: "#16A34A", lastMsg: "bot" },
];

const clients = [
  { name: "Carlos Mendoza", phone: "+52 443 123 4567", visits: 8, lastVisit: "Hoy", spent: "$480", initials: "CM", bg: "#DCFCE7", fg: "#16A34A" },
  { name: "Roberto Silva", phone: "+52 443 234 5678", visits: 5, lastVisit: "Ayer", spent: "$300", initials: "RS", bg: "#DBEAFE", fg: "#1D4ED8" },
  { name: "Miguel Torres", phone: "+52 443 345 6789", visits: 12, lastVisit: "Hace 3 días", spent: "$720", initials: "MT", bg: "#EDE9FE", fg: "#7C3AED" },
  { name: "Alejandro Ruiz", phone: "+52 443 456 7890", visits: 3, lastVisit: "Hace 1 sem", spent: "$180", initials: "AR", bg: "#FEF3C7", fg: "#D97706" },
  { name: "Pedro López", phone: "+52 443 567 8901", visits: 6, lastVisit: "Hace 2 sem", spent: "$360", initials: "PL", bg: "#F0FDF4", fg: "#16A34A" },
];

const services = [
  { name: "Corte clásico", duration: "30 min", price: "$60", color: "#22C55E", active: true },
  { name: "Corte + barba", duration: "45 min", price: "$90", color: "#3B82F6", active: true },
  { name: "Barba profesional", duration: "30 min", price: "$50", color: "#8B5CF6", active: true },
  { name: "Corte premium", duration: "45 min", price: "$80", color: "#F59E0B", active: true },
  { name: "Diseño de barba", duration: "30 min", price: "$70", color: "#EC4899", active: false },
];

const adminBusinesses = [
  { name: "Barbería Don Carlos", owner: "Carlos Mendoza", plan: "Activo", since: "Ene 2025", appts: 128, status: "active" },
  { name: "Salón Sofía", owner: "Sofía Ramírez", plan: "Prueba", since: "Jun 2025", appts: 14, status: "trial" },
  { name: "Nail Studio Ana", owner: "Ana Flores", plan: "Activo", since: "Mar 2025", appts: 89, status: "active" },
  { name: "Barbería El Estilo", owner: "Miguel Torres", plan: "Suspendido", since: "Feb 2025", appts: 0, status: "suspended" },
  { name: "Clínica Dental Ruiz", owner: "Dr. Alejandro Ruiz", plan: "Activo", since: "Abr 2025", appts: 67, status: "active" },
];

// ═══════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════

function Logo() {
  return (
    <div className="lb-logo">
      <div className="lb-logo-mark">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6h8M4 10h5M2 14l2-2H12a2 2 0 002-2V4a2 2 0 00-2-2H4a2 2 0 00-2 2v10z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="lb-logo-text">Local<span>Bot</span></div>
    </div>
  );
}

function Sidebar({ activeScreen, onNavigate, isAdmin }) {
  const businessNav = [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Inicio" },
    { id: "agenda", icon: "ti-calendar", label: "Agenda" },
    { id: "conversaciones", icon: "ti-message-2", label: "Conversaciones", badge: 3 },
    { id: "clientes", icon: "ti-users", label: "Clientes" },
    { id: "asistente", icon: "ti-robot", label: "Asistente IA" },
    { id: "configuracion", icon: "ti-settings", label: "Configuración" },
  ];

  const adminNav = [
    { id: "admin-overview", icon: "ti-layout-dashboard", label: "Overview" },
    { id: "admin-negocios", icon: "ti-building-store", label: "Negocios" },
    { id: "admin-suscripciones", icon: "ti-credit-card", label: "Suscripciones" },
    { id: "admin-ia", icon: "ti-brain", label: "IA Usage" },
    { id: "admin-whatsapp", icon: "ti-brand-whatsapp", label: "WhatsApp" },
    { id: "admin-config", icon: "ti-settings", label: "Configuración" },
  ];

  const navItems = isAdmin ? adminNav : businessNav;

  return (
    <div className="lb-sidebar">
      <Logo />
      <nav className="lb-nav">
        <div className="lb-nav-section">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`lb-nav-item ${activeScreen === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <i className={`ti ${item.icon} lb-nav-icon`} aria-hidden="true" />
              {item.label}
              {item.badge && <span className="lb-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
      </nav>
      <div className="lb-sidebar-footer">
        <div className="lb-business-card">
          <div className="lb-avatar lb-avatar-green">{isAdmin ? "SA" : "BC"}</div>
          <div style={{ minWidth: 0 }}>
            <div className="lb-business-name">{isAdmin ? "Super Admin" : "Barbería Don Carlos"}</div>
            <div className="lb-business-plan">{isAdmin ? "Administrador" : "Prueba · 12 días"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialBanner() {
  return (
    <div className="lb-trial-banner">
      <div className="lb-trial-icon">
        <i className="ti ti-clock" style={{ fontSize: 15 }} aria-hidden="true" />
      </div>
      <div>
        <span className="lb-trial-text"><strong>12 días restantes</strong> en tu período de prueba gratuita.</span>
        <span className="lb-trial-text" style={{ marginLeft: 6 }}>Activa tu suscripción para no perder el acceso.</span>
      </div>
      <button className="lb-trial-cta">Suscribirse · MXN 700/mes</button>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════

function Dashboard() {
  const [botActive, setBotActive] = useState(true);
  const sparkData = [40, 55, 35, 70, 85, 60, 90, 75, 88, 95, 72, 100];

  return (
    <div className="lb-content">
      <TrialBanner />

      {/* Bot toggle */}
      <div className="lb-toggle-wrap lb-mb-24">
        <label className="lb-toggle">
          <input type="checkbox" checked={botActive} onChange={() => setBotActive(!botActive)} />
          <div className="lb-toggle-track" />
        </label>
        <div>
          <div className="lb-toggle-label">Asistente WhatsApp</div>
          <div className="lb-toggle-sub">Responde mensajes automáticamente</div>
        </div>
        <div className="lb-toggle-status" style={{ color: botActive ? "#16A34A" : "#9CA3AF" }}>
          {botActive ? "Activo" : "Inactivo"}
        </div>
      </div>

      {/* Stats */}
      <div className="lb-stats-grid lb-mb-24">
        {[
          { label: "Citas hoy", value: "7", delta: "+2 vs ayer", up: true },
          { label: "Esta semana", value: "31", delta: "+8 vs semana pasada", up: true },
          { label: "Mensajes hoy", value: "24", delta: "12 respondidos por bot", up: null },
          { label: "Clientes totales", value: "148", delta: "+3 nuevos esta semana", up: true },
        ].map((s, i) => (
          <div key={i} className="lb-stat">
            <div className="lb-stat-label">{s.label}</div>
            <div className="lb-stat-value">{s.value}</div>
            <div className={`lb-stat-delta ${s.up === true ? "lb-delta-up" : "lb-delta-neutral"}`}>
              {s.up === true && <i className="ti ti-trending-up" style={{ fontSize: 13 }} aria-hidden="true" />}
              {s.delta}
            </div>
            {i === 2 && (
              <div className="lb-sparkline">
                {sparkData.map((h, j) => (
                  <div
                    key={j}
                    className={`lb-spark-bar ${j === sparkData.length - 1 ? "peak" : ""}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main two-col */}
      <div className="lb-flex lb-mb-20">
        {/* Today's appointments */}
        <div className="lb-card lb-flex-1">
          <div className="lb-card-header">
            <div>
              <div className="lb-card-title">Citas de hoy</div>
              <div className="lb-card-sub">Martes 9 de junio · 7 citas</div>
            </div>
            <button className="lb-btn lb-btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
              <i className="ti ti-plus" aria-hidden="true" />
              Nueva cita
            </button>
          </div>
          {appointments.map((a, i) => (
            <div key={i} className="lb-appt">
              <div className="lb-appt-time">
                <div className="lb-appt-time-main">{a.time}</div>
                <div className="lb-appt-time-ampm">{a.ampm}</div>
              </div>
              <div className="lb-appt-bar" style={{ background: a.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lb-appt-name">{a.name}</div>
                <div className="lb-appt-service">{a.service} · {a.duration} min</div>
              </div>
              <span className={`lb-pill ${a.status === "confirmed" ? "lb-pill-green" : "lb-pill-yellow"}`}>
                <span className="lb-dot" />
                {a.status === "confirmed" ? "Confirmada" : "Pendiente"}
              </span>
              <div className="lb-appt-actions">
                <button className="lb-btn-icon"><i className="ti ti-edit" aria-hidden="true" /></button>
                <button className="lb-btn-icon" style={{ color: "#DC2626" }}><i className="ti ti-x" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Right col */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Mini calendar */}
          <div className="lb-card">
            <div className="lb-card-header">
              <div className="lb-card-title">Junio 2025</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="lb-btn-icon" style={{ width: 26, height: 26 }}>
                  <i className="ti ti-chevron-left" style={{ fontSize: 13 }} aria-hidden="true" />
                </button>
                <button className="lb-btn-icon" style={{ width: 26, height: 26 }}>
                  <i className="ti ti-chevron-right" style={{ fontSize: 13 }} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="lb-mini-cal">
              {["L","M","X","J","V","S","D"].map(d => (
                <div key={d} className="lb-cal-header">{d}</div>
              ))}
              {[26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d, i) => (
                <div
                  key={i}
                  className={`lb-cal-day ${d === 9 && i > 6 ? "today" : ""} ${[3,5,9,11,14,16,18].includes(i) && d !== 9 ? "has-appt" : ""} ${i < 5 || i > 33 ? "other-month" : ""}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Recent conversations */}
          <div className="lb-card">
            <div className="lb-card-header">
              <div className="lb-card-title">Conversaciones</div>
              <span className="lb-pill lb-pill-blue">3 sin leer</span>
            </div>
            {conversations.slice(0, 3).map((c, i) => (
              <div key={i} className="lb-conv">
                <div className="lb-conv-avatar" style={{ background: c.bg, color: c.fg }}>{c.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lb-conv-name">{c.name}</div>
                  <div className="lb-conv-preview">{c.preview}</div>
                </div>
                <div className="lb-conv-meta">
                  <div className="lb-conv-time">{c.time}</div>
                  {c.unread > 0 && <div className="lb-unread">{c.unread}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Agenda() {
  const [view, setView] = useState("day");
  return (
    <div className="lb-content">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className={`lb-tab ${view === "day" ? "active" : ""}`} style={{ padding: "6px 14px" }} onClick={() => setView("day")}>Día</button>
        <button className={`lb-tab ${view === "week" ? "active" : ""}`} style={{ padding: "6px 14px" }} onClick={() => setView("week")}>Semana</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="lb-btn lb-btn-ghost">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0D1117", padding: "7px 0", minWidth: 160, textAlign: "center" }}>
            Martes, 9 de junio
          </span>
          <button className="lb-btn lb-btn-ghost">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
          <button className="lb-btn lb-btn-primary" style={{ marginLeft: 8 }}>
            <i className="ti ti-plus" aria-hidden="true" />
            Nueva cita
          </button>
        </div>
      </div>

      <div className="lb-flex">
        <div className="lb-card lb-flex-1">
          {/* Timeline */}
          {["9:00","9:45","10:30","11:00","11:30","12:00","12:30","1:00","1:30","2:00","2:30","3:00","3:15","4:00","4:30"].map((t, i) => {
            const appt = appointments.find(a => a.time === t.split(":")[0] + ":" + t.split(":")[1]);
            return (
              <div key={t} style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.04)", minHeight: 52 }}>
                <div style={{ width: 60, padding: "8px 12px 0", color: "#9CA3AF", fontSize: 12, flexShrink: 0, borderRight: "1px solid rgba(0,0,0,0.04)" }}>
                  {t}
                </div>
                <div style={{ flex: 1, padding: "6px 12px" }}>
                  {appt && (
                    <div style={{
                      background: appt.color + "14",
                      border: `1px solid ${appt.color}30`,
                      borderLeft: `3px solid ${appt.color}`,
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117" }}>{appt.name}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{appt.service} · {appt.duration} min</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="lb-card lb-card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117", marginBottom: 12 }}>Resumen del día</div>
            {[
              { label: "Citas confirmadas", value: "6", color: "#22C55E" },
              { label: "Pendientes", value: "1", color: "#F59E0B" },
              { label: "Horas ocupadas", value: "4.5h", color: "#3B82F6" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <span style={{ fontSize: 12.5, color: "#6B7280" }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="lb-card">
            <div className="lb-card-header">
              <div className="lb-card-title">Nueva cita</div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div className="lb-form-group">
                <label className="lb-label">Cliente</label>
                <input className="lb-input" placeholder="Nombre o teléfono" />
              </div>
              <div className="lb-form-group">
                <label className="lb-label">Servicio</label>
                <select className="lb-select">
                  <option>Corte clásico</option>
                  <option>Corte + barba</option>
                  <option>Barba profesional</option>
                </select>
              </div>
              <div className="lb-form-group">
                <label className="lb-label">Hora</label>
                <input className="lb-input" type="time" defaultValue="09:00" />
              </div>
              <button className="lb-btn lb-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Agendar cita
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Conversaciones() {
  const [active, setActive] = useState(1);
  const chatMessages = [
    { type: "time", text: "Hoy · 10:24 AM" },
    { type: "in", text: "Hola, ¿tienen lugar para mañana?" },
    { type: "out", text: "¡Hola! Soy el asistente de Barbería Don Carlos. Claro que sí, ¿a qué hora te vendría bien?" },
    { type: "in", text: "A las 11, si es posible" },
    { type: "out", text: "Perfecto, las 11:00 AM está disponible. ¿Qué servicio te gustaría? Tenemos: Corte clásico ($60), Corte + barba ($90), o Barba profesional ($50)." },
    { type: "in", text: "Corte clásico por favor" },
    { type: "out", text: "Listo, queda agendado: Corte clásico mañana miércoles 10 de junio a las 11:00 AM. Tu nombre, ¿cómo te llamas?" },
    { type: "in", text: "Sofía Ramírez" },
    { type: "out", text: "Confirmado, Sofía. Te esperamos mañana a las 11. Si necesitas cancelar o cambiar la hora, solo avísanos aquí. ¡Hasta mañana!" },
  ];

  return (
    <div className="lb-content" style={{ padding: 0, display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Conv list */}
      <div style={{ width: 280, borderRight: "1px solid rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <input className="lb-input" placeholder="Buscar conversación..." style={{ fontSize: 13 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((c, i) => (
            <div key={i} className={`lb-conv ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
              <div className="lb-conv-avatar" style={{ background: c.bg, color: c.fg }}>{c.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lb-conv-name">{c.name}</div>
                <div className="lb-conv-preview">{c.preview}</div>
              </div>
              <div className="lb-conv-meta">
                <div className="lb-conv-time">{c.time}</div>
                {c.unread > 0 && <div className="lb-unread">{c.unread}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Chat header */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="lb-conv-avatar" style={{ background: conversations[active].bg, color: conversations[active].fg }}>
            {conversations[active].initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0D1117" }}>{conversations[active].name}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>+52 443 234 5678 · WhatsApp</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="lb-pill lb-pill-green"><span className="lb-dot" />Bot activo</span>
            <button className="lb-btn-icon"><i className="ti ti-dots" aria-hidden="true" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="lb-chat-area">
          {chatMessages.map((m, i) => (
            m.type === "time"
              ? <div key={i} className="lb-bubble-time">{m.text}</div>
              : <div key={i} className={`lb-bubble lb-bubble-${m.type}`}>{m.text}</div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 8 }}>
          <input className="lb-input" placeholder="Responder como negocio..." style={{ flex: 1 }} />
          <button className="lb-btn lb-btn-primary" style={{ padding: "7px 16px" }}>Enviar</button>
        </div>
      </div>
    </div>
  );
}

function Clientes() {
  const [tab, setTab] = useState("todos");
  return (
    <div className="lb-content">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="lb-tabs" style={{ marginBottom: 0, borderBottom: "none" }}>
          {["todos","frecuentes","nuevos"].map(t => (
            <button key={t} className={`lb-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "todos" ? "Todos" : t === "frecuentes" ? "Frecuentes" : "Nuevos este mes"}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input className="lb-input" placeholder="Buscar cliente..." style={{ width: 200 }} />
          <button className="lb-btn lb-btn-ghost">
            <i className="ti ti-download" aria-hidden="true" />
            Exportar
          </button>
        </div>
      </div>

      <div className="lb-card">
        <div style={{ padding: "10px 20px 6px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 12 }}>
          {["Cliente","Visitas","Última visita","Total gastado",""].map((h, i) => (
            <div key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</div>
          ))}
        </div>
        {clients.map((c, i) => (
          <div key={i} style={{
            padding: "14px 20px",
            borderBottom: i < clients.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            transition: "background 0.1s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="lb-avatar" style={{ background: c.bg, color: c.fg, width: 34, height: 34, borderRadius: "50%", fontSize: 12 }}>{c.initials}</div>
              <div>
                <div className="lb-client-name">{c.name}</div>
                <div className="lb-client-phone">{c.phone}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#374151" }}>{c.visits} visitas</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{c.lastVisit}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117" }}>{c.spent}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                <i className="ti ti-message-2" style={{ fontSize: 14 }} aria-hidden="true" />
              </button>
              <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                <i className="ti ti-dots-vertical" style={{ fontSize: 14 }} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Asistente() {
  return (
    <div className="lb-content">
      <div className="lb-flex lb-mb-20">
        <div className="lb-card lb-flex-1">
          <div className="lb-card-header">
            <div>
              <div className="lb-card-title">Estado del asistente</div>
              <div className="lb-card-sub">Rendimiento de los últimos 30 días</div>
            </div>
            <span className="lb-pill lb-pill-green"><span className="lb-dot" />Operando normalmente</span>
          </div>
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Mensajes procesados", value: "312", delta: "este mes" },
              { label: "Citas agendadas por bot", value: "47", delta: "este mes" },
              { label: "Tasa de respuesta", value: "98.7%", delta: "promedio" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#F8F9FB", borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 600, color: "#0D1117", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="lb-card lb-card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117", marginBottom: 12 }}>Proveedor de IA</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, background: "#F0FDF4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-brain" style={{ color: "#16A34A", fontSize: 18 }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117" }}>Groq · Llama 3.1</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>8B instant · Principal</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Tokens este mes</span>
                <span style={{ fontWeight: 600, color: "#374151" }}>1.2M</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Costo estimado</span>
                <span style={{ fontWeight: 600, color: "#16A34A" }}>~MXN 42</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lb-card">
        <div className="lb-card-header">
          <div>
            <div className="lb-card-title">Mensaje de cierre</div>
            <div className="lb-card-sub">Se envía cuando el bot está inactivo</div>
          </div>
          <button className="lb-btn lb-btn-ghost" style={{ fontSize: 12 }}>Guardar cambios</button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <textarea
            className="lb-input"
            style={{ height: 80, resize: "vertical", paddingTop: 8, lineHeight: 1.5 }}
            defaultValue="Hola, en este momento no estoy disponible. Te atenderé en cuanto pueda. Si quieres agendar una cita, vuelve a escribir durante nuestro horario de atención: lunes a sábado de 9 AM a 7 PM."
          />
        </div>
      </div>
    </div>
  );
}

function Configuracion() {
  const [tab, setTab] = useState("negocio");
  const days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const [schedule, setSchedule] = useState([true,true,true,true,true,true,false]);

  return (
    <div className="lb-content">
      <div className="lb-tabs">
        {[["negocio","Negocio"],["horario","Horario"],["servicios","Servicios"],["whatsapp","WhatsApp"]].map(([id, label]) => (
          <button key={id} className={`lb-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "negocio" && (
        <div style={{ maxWidth: 600 }}>
          <div className="lb-card">
            <div className="lb-card-header"><div className="lb-card-title">Información del negocio</div></div>
            <div style={{ padding: "20px" }}>
              <div className="lb-grid-2">
                <div className="lb-form-group">
                  <label className="lb-label">Nombre del negocio</label>
                  <input className="lb-input" defaultValue="Barbería Don Carlos" />
                </div>
                <div className="lb-form-group">
                  <label className="lb-label">Tipo de negocio</label>
                  <select className="lb-select"><option>Barbería</option><option>Salón de belleza</option><option>Clínica dental</option><option>Restaurante</option></select>
                </div>
              </div>
              <div className="lb-form-group">
                <label className="lb-label">Dirección</label>
                <input className="lb-input" defaultValue="Av. Madero 145, Centro, Morelia" />
              </div>
              <div className="lb-grid-2">
                <div className="lb-form-group">
                  <label className="lb-label">Teléfono de contacto</label>
                  <input className="lb-input" defaultValue="+52 443 123 4567" />
                </div>
                <div className="lb-form-group">
                  <label className="lb-label">Correo electrónico</label>
                  <input className="lb-input" defaultValue="carlos@barberiaDonCarlos.mx" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button className="lb-btn lb-btn-ghost">Cancelar</button>
                <button className="lb-btn lb-btn-primary">Guardar cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "horario" && (
        <div style={{ maxWidth: 560 }}>
          <div className="lb-card">
            <div className="lb-card-header">
              <div>
                <div className="lb-card-title">Horario de atención</div>
                <div className="lb-card-sub">El bot solo agenda citas en estos horarios</div>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {days.map((d, i) => (
                <div key={d} className="lb-schedule-day">
                  <span className="lb-day-name">{d}</span>
                  <label className="lb-toggle" style={{ margin: "0 8px" }}>
                    <input type="checkbox" checked={schedule[i]} onChange={() => {
                      const s = [...schedule]; s[i] = !s[i]; setSchedule(s);
                    }} />
                    <div className="lb-toggle-track" />
                  </label>
                  {schedule[i] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <input className="lb-input" type="time" defaultValue="09:00" style={{ width: 100 }} />
                      <span style={{ color: "#9CA3AF", fontSize: 13 }}>—</span>
                      <input className="lb-input" type="time" defaultValue="19:00" style={{ width: 100 }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>Cerrado</span>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button className="lb-btn lb-btn-primary">Guardar horario</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "servicios" && (
        <div style={{ maxWidth: 600 }}>
          <div className="lb-card lb-mb-16">
            <div className="lb-card-header">
              <div className="lb-card-title">Catálogo de servicios</div>
              <button className="lb-btn lb-btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                <i className="ti ti-plus" aria-hidden="true" />
                Agregar servicio
              </button>
            </div>
            {services.map((s, i) => (
              <div key={i} className="lb-service">
                <div className="lb-service-color" style={{ background: s.color }} />
                <div style={{ flex: 1 }}>
                  <div className="lb-service-name">{s.name}</div>
                  <div className="lb-service-meta">{s.duration}</div>
                </div>
                <div className="lb-service-price">{s.price}</div>
                <span className={`lb-pill ${s.active ? "lb-pill-green" : "lb-pill-gray"}`} style={{ marginLeft: 12 }}>
                  {s.active ? "Activo" : "Inactivo"}
                </span>
                <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                  <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                    <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                  </button>
                  <button className="lb-btn-icon" style={{ width: 28, height: 28, color: "#DC2626" }}>
                    <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "whatsapp" && (
        <div style={{ maxWidth: 560 }}>
          <div className="lb-card">
            <div className="lb-card-header">
              <div>
                <div className="lb-card-title">Configuración de WhatsApp</div>
                <div className="lb-card-sub">Credenciales de la API de Meta</div>
              </div>
              <span className="lb-pill lb-pill-green"><span className="lb-dot" />Conectado</span>
            </div>
            <div style={{ padding: "20px" }}>
              <div className="lb-form-group">
                <label className="lb-label">Phone Number ID</label>
                <input className="lb-input" defaultValue="118204554332211" type="password" />
              </div>
              <div className="lb-form-group">
                <label className="lb-label">Token de acceso</label>
                <input className="lb-input" defaultValue="EAAxxxxxx..." type="password" />
              </div>
              <div className="lb-form-group">
                <label className="lb-label">Token de verificación del webhook</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="lb-input" defaultValue="lb_verify_8f3k2m" readOnly style={{ flex: 1, background: "#FAFAFA", color: "#6B7280" }} />
                  <button className="lb-btn lb-btn-ghost" style={{ padding: "7px 12px" }}>
                    <i className="ti ti-copy" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div style={{ background: "#F0FDF4", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: 12.5, color: "#16A34A", marginBottom: 16 }}>
                <strong>Webhook URL:</strong> https://localbot.railway.app/webhook/tenant_abc123
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="lb-btn lb-btn-ghost">Probar conexión</button>
                <button className="lb-btn lb-btn-primary">Guardar cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ADMIN SCREENS ──

function AdminOverview() {
  const activities = [
    { text: "Salón Sofía se registró en período de prueba", time: "Hace 20 min", color: "#22C55E" },
    { text: "Barbería El Estilo — suscripción suspendida automáticamente", time: "Hace 2 hr", color: "#EF4444" },
    { text: "Clínica Dental Ruiz — renovación de suscripción", time: "Ayer 3:40 PM", color: "#3B82F6" },
    { text: "Nail Studio Ana — 89 citas procesadas este mes", time: "Ayer 9:00 AM", color: "#8B5CF6" },
    { text: "Barbería Don Carlos — activó WhatsApp correctamente", time: "Hace 3 días", color: "#F59E0B" },
  ];

  return (
    <div className="lb-content">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { n: "12", l: "Negocios activos" },
          { n: "3", l: "En período de prueba" },
          { n: "1", l: "Suspendidos" },
          { n: "MXN 7,700", l: "MRR actual" },
        ].map((s, i) => (
          <div key={i} className="lb-admin-stat">
            <div className="lb-admin-stat-n">{s.n}</div>
            <div className="lb-admin-stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="lb-flex">
        <div className="lb-card lb-flex-1">
          <div className="lb-card-header">
            <div className="lb-card-title">Negocios recientes</div>
            <button className="lb-btn lb-btn-ghost" style={{ fontSize: 12 }}>Ver todos</button>
          </div>
          <table className="lb-table">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Propietario</th>
                <th>Estado</th>
                <th>Citas (mes)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {adminBusinesses.map((b, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 550, color: "#0D1117" }}>{b.name}</td>
                  <td>{b.owner}</td>
                  <td>
                    <span className={`lb-pill ${b.status === "active" ? "lb-pill-green" : b.status === "trial" ? "lb-pill-yellow" : "lb-pill-red"}`}>
                      <span className="lb-dot" />
                      {b.status === "active" ? "Activo" : b.status === "trial" ? "Prueba" : "Suspendido"}
                    </span>
                  </td>
                  <td>{b.appts}</td>
                  <td>
                    <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                      <i className="ti ti-dots-vertical" style={{ fontSize: 13 }} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          <div className="lb-card lb-card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1117", marginBottom: 16 }}>Actividad reciente</div>
            {activities.map((a, i) => (
              <div key={i} className="lb-activity">
                <div className="lb-activity-dot" style={{ background: a.color }} />
                <div>
                  <div className="lb-activity-text">{a.text}</div>
                  <div className="lb-activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNegocios() {
  return (
    <div className="lb-content">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <input className="lb-input" placeholder="Buscar negocio..." style={{ width: 240 }} />
        <select className="lb-select" style={{ width: 160 }}>
          <option>Todos los estados</option>
          <option>Activos</option>
          <option>En prueba</option>
          <option>Suspendidos</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="lb-btn lb-btn-primary">
            <i className="ti ti-plus" aria-hidden="true" />
            Nuevo negocio
          </button>
        </div>
      </div>
      <div className="lb-card">
        <table className="lb-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Propietario</th>
              <th>Plan</th>
              <th>Desde</th>
              <th>Citas este mes</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {adminBusinesses.map((b, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 550, color: "#0D1117" }}>{b.name}</div>
                </td>
                <td style={{ color: "#6B7280" }}>{b.owner}</td>
                <td>
                  <span className={`lb-pill ${b.status === "active" ? "lb-pill-blue" : b.status === "trial" ? "lb-pill-yellow" : "lb-pill-gray"}`}>
                    {b.plan}
                  </span>
                </td>
                <td style={{ color: "#6B7280" }}>{b.since}</td>
                <td style={{ fontWeight: 550 }}>{b.appts}</td>
                <td>
                  <span className={`lb-pill ${b.status === "active" ? "lb-pill-green" : b.status === "trial" ? "lb-pill-yellow" : "lb-pill-red"}`}>
                    <span className="lb-dot" />
                    {b.status === "active" ? "Activo" : b.status === "trial" ? "Prueba" : "Suspendido"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                      <i className="ti ti-eye" style={{ fontSize: 13 }} aria-hidden="true" />
                    </button>
                    <button className="lb-btn-icon" style={{ width: 28, height: 28 }}>
                      <i className="ti ti-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSuscripciones() {
  return (
    <div className="lb-content">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { n: "MXN 7,700", l: "MRR", delta: "+MXN 700 este mes", up: true },
          { n: "12", l: "Suscriptores activos", delta: "+1 este mes", up: true },
          { n: "3", l: "Trials activos", delta: "Expiran en 8–24 días", up: null },
        ].map((s, i) => (
          <div key={i} className="lb-admin-stat">
            <div className="lb-admin-stat-n">{s.n}</div>
            <div className="lb-admin-stat-l">{s.l}</div>
            <div className={`lb-stat-delta ${s.up ? "lb-delta-up" : "lb-delta-neutral"}`} style={{ marginTop: 8 }}>
              {s.up && <i className="ti ti-trending-up" style={{ fontSize: 13 }} aria-hidden="true" />}
              {s.delta}
            </div>
          </div>
        ))}
      </div>
      <div className="lb-card">
        <div className="lb-card-header">
          <div className="lb-card-title">Historial de suscripciones</div>
        </div>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Monto</th>
              <th>Período</th>
              <th>Próximo cobro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {adminBusinesses.filter(b => b.status !== "suspended").map((b, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 550, color: "#0D1117" }}>{b.name}</td>
                <td style={{ fontWeight: 600, color: "#16A34A" }}>{b.status === "trial" ? "MXN 0" : "MXN 700"}</td>
                <td style={{ color: "#6B7280" }}>{b.status === "trial" ? "Prueba 30 días" : "Mensual"}</td>
                <td style={{ color: "#374151" }}>{b.status === "trial" ? `Vence 30 jun` : "1 jul 2025"}</td>
                <td>
                  <span className={`lb-pill ${b.status === "active" ? "lb-pill-green" : "lb-pill-yellow"}`}>
                    <span className="lb-dot" />
                    {b.status === "active" ? "Al corriente" : "Trial"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TOPBAR TITLES
// ═══════════════════════════════════════
const screenTitles = {
  dashboard: { title: "Inicio", sub: "Barbería Don Carlos" },
  agenda: { title: "Agenda", sub: "" },
  conversaciones: { title: "Conversaciones", sub: "" },
  clientes: { title: "Clientes", sub: "" },
  asistente: { title: "Asistente IA", sub: "" },
  configuracion: { title: "Configuración", sub: "" },
  "admin-overview": { title: "Overview", sub: "Super Admin" },
  "admin-negocios": { title: "Negocios", sub: "" },
  "admin-suscripciones": { title: "Suscripciones", sub: "" },
  "admin-ia": { title: "IA Usage", sub: "" },
  "admin-whatsapp": { title: "WhatsApp", sub: "" },
  "admin-config": { title: "Configuración", sub: "" },
};

// ═══════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════
const allScreens = [
  { id: "dashboard", label: "Dashboard" },
  { id: "agenda", label: "Agenda" },
  { id: "conversaciones", label: "Mensajes" },
  { id: "clientes", label: "Clientes" },
  { id: "asistente", label: "Asistente" },
  { id: "configuracion", label: "Config" },
  { id: "admin-overview", label: "Admin" },
  { id: "admin-negocios", label: "Negocios" },
  { id: "admin-suscripciones", label: "Suscripc." },
];

export default function LocalBotApp() {
  const [screen, setScreen] = useState("dashboard");
  const isAdmin = screen.startsWith("admin");
  const meta = screenTitles[screen] || { title: "", sub: "" };

  function renderScreen() {
    switch (screen) {
      case "dashboard": return <Dashboard />;
      case "agenda": return <Agenda />;
      case "conversaciones": return <Conversaciones />;
      case "clientes": return <Clientes />;
      case "asistente": return <Asistente />;
      case "configuracion": return <Configuracion />;
      case "admin-overview": return <AdminOverview />;
      case "admin-negocios": return <AdminNegocios />;
      case "admin-suscripciones": return <AdminSuscripciones />;
      default: return (
        <div className="lb-content">
          <div className="lb-empty">
            <div className="lb-empty-icon"><i className="ti ti-tool" /></div>
            <div className="lb-empty-title">Pantalla en construcción</div>
            <div className="lb-empty-sub">Esta sección ya tiene su estructura definida y está lista para conectarse al backend.</div>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="lb-root">
        <Sidebar activeScreen={screen} onNavigate={setScreen} isAdmin={isAdmin} />
        <div className="lb-main">
          <div className="lb-topbar">
            <div>
              <span className="lb-topbar-title">{meta.title}</span>
              {meta.sub && <span className="lb-topbar-sub">· {meta.sub}</span>}
            </div>
            <div className="lb-topbar-right">
              <button className="lb-btn-icon">
                <i className="ti ti-bell" aria-hidden="true" />
              </button>
              <div className="lb-avatar lb-avatar-green" style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 11 }}>BC</div>
            </div>
          </div>
          {renderScreen()}
        </div>
      </div>

      {/* Screen selector */}
      <div className="lb-demo-bar">
        {allScreens.map(s => (
          <button
            key={s.id}
            className={`lb-demo-btn ${screen === s.id ? "active" : ""}`}
            onClick={() => setScreen(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}
