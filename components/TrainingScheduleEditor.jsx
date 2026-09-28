"use client";

import { Plus, Trash2 } from "lucide-react";
import { DAYS } from "@/lib/constants";

let tempIdCounter = 0;
function tempId() {
  tempIdCounter += 1;
  return `tmp_${tempIdCounter}`;
}

// events: array of { id, day_of_week, label, event_time, is_game_day }
export function TrainingScheduleEditor({ events, onChange }) {
  const addEvent = (day) => {
    onChange([...events, { id: tempId(), day_of_week: day, label: "", event_time: "16:00", is_game_day: false }]);
  };
  const updateEvent = (id, patch) => {
    onChange(events.map(e => e.id === id ? { ...e, ...patch } : e));
  };
  const removeEvent = (id) => {
    onChange(events.filter(e => e.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {DAYS.map(day => {
        const dayEvents = events.filter(e => e.day_of_week === day);
        return (
          <div key={day}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fu-text)" }}>{day}</div>
              <button onClick={() => addEvent(day)} type="button" style={{
                display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
                color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 4
              }}>
                <Plus size={13} /> Add
              </button>
            </div>
            {dayEvents.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--fu-text-muted)", marginBottom: 4 }}>No training scheduled</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayEvents.map(ev => (
                <div key={ev.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={ev.label}
                      onChange={e => updateEvent(ev.id, { label: e.target.value })}
                      placeholder="e.g. Lift, Practice"
                      style={{ flex: 1, boxSizing: "border-box", padding: "9px 10px", borderRadius: 10, border: "1.5px solid var(--fu-border)", fontSize: 13, outline: "none", background: "var(--fu-card-alt)", color: "var(--fu-text)" }}
                    />
                    <input
                      type="time"
                      value={ev.event_time}
                      onChange={e => updateEvent(ev.id, { event_time: e.target.value })}
                      style={{ width: 118, boxSizing: "border-box", padding: "9px 10px", borderRadius: 10, border: "1.5px solid var(--fu-border)", fontSize: 13, outline: "none", background: "var(--fu-card-alt)", color: "var(--fu-text)" }}
                    />
                    <button onClick={() => removeEvent(ev.id)} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Trash2 size={15} color="#FF5A5F" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateEvent(ev.id, { is_game_day: !ev.is_game_day })}
                    style={{
                      alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999,
                      border: ev.is_game_day ? "1.5px solid #fff" : "1.5px solid var(--fu-border)",
                      background: ev.is_game_day ? "var(--fu-cta-bg)" : "transparent",
                      color: ev.is_game_day ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
                      fontWeight: 700, fontSize: 11, cursor: "pointer"
                    }}
                  >
                    {ev.is_game_day ? "Game day — carb target boosted" : "Mark as game day"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
