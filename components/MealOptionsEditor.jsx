"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SmallField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function MealOptionsEditor({ mealId, groups, onGroupsChange }) {
  const [newGroup, setNewGroup] = useState({ name: "", selection_type: "single", required: true });
  const [newOption, setNewOption] = useState({}); // keyed by group id -> { label, price_delta, calories_delta, protein_delta, carbs_delta, fat_delta }

  const sorted = [...groups].sort((a, b) => a.sort_order - b.sort_order);

  const addGroup = async () => {
    if (!newGroup.name.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("meal_option_groups").insert({
      meal_id: mealId, name: newGroup.name.trim(), selection_type: newGroup.selection_type,
      required: newGroup.required, sort_order: groups.length,
    }).select().single();
    if (!error) {
      onGroupsChange([...groups, { ...data, meal_options: [] }]);
      setNewGroup({ name: "", selection_type: "single", required: true });
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Delete this option group and all its choices?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("meal_option_groups").delete().eq("id", groupId);
    if (!error) onGroupsChange(groups.filter(g => g.id !== groupId));
  };

  const addOption = async (groupId) => {
    const form = newOption[groupId] || {};
    if (!form.label?.trim()) return;
    const group = groups.find(g => g.id === groupId);
    const supabase = createClient();
    const { data, error } = await supabase.from("meal_options").insert({
      group_id: groupId, label: form.label.trim(),
      price_delta: Number(form.price_delta) || 0,
      calories_delta: Number(form.calories_delta) || 0,
      protein_delta: Number(form.protein_delta) || 0,
      carbs_delta: Number(form.carbs_delta) || 0,
      fat_delta: Number(form.fat_delta) || 0,
      sort_order: group.meal_options.length,
    }).select().single();
    if (!error) {
      onGroupsChange(groups.map(g => g.id === groupId ? { ...g, meal_options: [...g.meal_options, data] } : g));
      setNewOption(s => ({ ...s, [groupId]: {} }));
    }
  };

  const deleteOption = async (groupId, optionId) => {
    const supabase = createClient();
    const { error } = await supabase.from("meal_options").delete().eq("id", optionId);
    if (!error) {
      onGroupsChange(groups.map(g => g.id === groupId ? { ...g, meal_options: g.meal_options.filter(o => o.id !== optionId) } : g));
    }
  };

  const setOptionField = (groupId, field, value) => {
    setNewOption(s => ({ ...s, [groupId]: { ...s[groupId], [field]: value } }));
  };

  return (
    <div style={{ marginTop: 4, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 8 }}>Customization options</div>

      {sorted.map(group => (
        <div key={group.id} style={{ background: "var(--fu-card-alt)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fu-text)" }}>
              {group.name} <span style={{ fontSize: 10.5, color: "var(--fu-text-muted)", fontWeight: 500 }}>({group.selection_type === "single" ? "pick one" : "pick any"}{group.required ? ", required" : ""})</span>
            </div>
            <button onClick={() => deleteGroup(group.id)} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Trash2 size={13} color="#FF5A5F" />
            </button>
          </div>

          {group.meal_options.map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--fu-border)" }}>
              <span style={{ fontSize: 12.5, color: "var(--fu-text)" }}>{o.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11.5, color: "var(--fu-text-secondary)" }}>
                  {Number(o.price_delta) !== 0 && `${Number(o.price_delta) > 0 ? "+" : ""}$${Number(o.price_delta).toFixed(2)} `}
                  {Number(o.calories_delta) !== 0 && `${Number(o.calories_delta) > 0 ? "+" : ""}${o.calories_delta}cal`}
                </span>
                <button onClick={() => deleteOption(group.id, o.id)} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Trash2 size={12} color="#FF5A5F" />
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <SmallField label="Option label" value={newOption[group.id]?.label || ""} onChange={e => setOptionField(group.id, "label", e.target.value)} placeholder="e.g. Extra protein" />
              <SmallField label="Price +/-" type="number" step="0.01" value={newOption[group.id]?.price_delta || ""} onChange={e => setOptionField(group.id, "price_delta", e.target.value)} placeholder="2.00" />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <SmallField label="Cal +/-" type="number" value={newOption[group.id]?.calories_delta || ""} onChange={e => setOptionField(group.id, "calories_delta", e.target.value)} placeholder="0" />
              <SmallField label="Protein +/-" type="number" value={newOption[group.id]?.protein_delta || ""} onChange={e => setOptionField(group.id, "protein_delta", e.target.value)} placeholder="0" />
              <SmallField label="Carbs +/-" type="number" value={newOption[group.id]?.carbs_delta || ""} onChange={e => setOptionField(group.id, "carbs_delta", e.target.value)} placeholder="0" />
              <SmallField label="Fat +/-" type="number" value={newOption[group.id]?.fat_delta || ""} onChange={e => setOptionField(group.id, "fat_delta", e.target.value)} placeholder="0" />
            </div>
            <button onClick={() => addOption(group.id)} type="button" style={{
              display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
              color: "#2A3EFF", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 4
            }}>
              <Plus size={13} /> Add option
            </button>
          </div>
        </div>
      ))}

      <div style={{ background: "var(--fu-card-alt)", borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 8 }}>New option group</div>
        <SmallField label="Group name" value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} placeholder="e.g. Choose your carb" />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: "var(--fu-text)", display: "flex", alignItems: "center", gap: 6 }}>
            <select value={newGroup.selection_type} onChange={e => setNewGroup(g => ({ ...g, selection_type: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card)", color: "var(--fu-text)", fontSize: 12.5 }}>
              <option value="single">Pick one</option>
              <option value="multi">Pick any</option>
            </select>
          </label>
          <label style={{ fontSize: 12, color: "var(--fu-text)", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={newGroup.required} onChange={e => setNewGroup(g => ({ ...g, required: e.target.checked }))} />
            Required
          </label>
        </div>
        <button onClick={addGroup} type="button" style={{
          display: "flex", alignItems: "center", gap: 6, background: "#2A3EFF", border: "none", borderRadius: 10,
          padding: "8px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
        }}>
          <Plus size={13} /> Add group
        </button>
      </div>
    </div>
  );
}
