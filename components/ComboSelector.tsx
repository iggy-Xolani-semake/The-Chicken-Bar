"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/supabase/types";
import type { ResolvedComboChoice } from "@/lib/cart/cartLogic";
import { validateComboSelection } from "@/lib/cart/cartLogic";

interface ComboSelectorProps {
  item: MenuItem;
  onConfirm: (resolvedChoices: ResolvedComboChoice[]) => void;
  onCancel: () => void;
}

export default function ComboSelector({ item, onConfirm, onCancel }: ComboSelectorProps) {
  // selections: optionGroupId -> array of selected choiceIds. Using an array
  // even for min_select=max_select=1 groups keeps this generic enough to
  // support future combos with real multi-select groups (e.g. "choose 2 sides")
  // without a separate code path.
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const { valid, missingGroups } = validateComboSelection(item, selections);

  function toggleChoice(groupId: string, choiceId: string, maxSelect: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      const alreadySelected = current.includes(choiceId);

      if (alreadySelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== choiceId) };
      }

      if (maxSelect === 1) {
        // single-select group — new choice replaces whatever was picked
        return { ...prev, [groupId]: [choiceId] };
      }

      // multi-select group — respect max_select ceiling, don't silently
      // allow over-selection past what the group permits
      if (current.length >= maxSelect) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, choiceId] };
    });
  }

  function handleConfirm() {
    if (!valid) return;

    const resolved: ResolvedComboChoice[] = [];
    for (const group of item.combo_option_groups) {
      const selectedIds = selections[group.id] ?? [];
      for (const choiceId of selectedIds) {
        const choice = group.combo_option_choices.find((c) => c.id === choiceId);
        if (choice) {
          resolved.push({
            optionGroupId: group.id,
            optionGroupName: group.name,
            choiceId: choice.id,
            choiceName: choice.name,
            priceDelta: choice.price_delta,
          });
        }
      }
    }
    onConfirm(resolved);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="combo-selector-title"
    >
      <div className="bg-smoke-light w-full sm:max-w-md sm:rounded-sm border border-bone/10 max-h-[85vh] overflow-y-auto">
        <div className="p-6 border-b border-bone/10">
          <h3 id="combo-selector-title" className="font-body font-bold text-bone text-xl">
            {item.name}
          </h3>
          <p className="font-utility text-flame text-lg mt-1">R{item.price}</p>
        </div>

        <div className="p-6 space-y-6">
          {item.combo_option_groups.map((group) => {
            const selectedForGroup = selections[group.id] ?? [];
            const groupSatisfied =
              selectedForGroup.length >= group.min_select &&
              selectedForGroup.length <= group.max_select;

            return (
              <fieldset key={group.id}>
                <legend className="font-body font-semibold text-bone mb-3 flex items-center gap-2">
                  {group.name}
                  {!groupSatisfied && (
                    <span className="font-utility text-xs text-ember">
                      (choose {group.min_select === group.max_select
                        ? group.min_select
                        : `${group.min_select}-${group.max_select}`})
                    </span>
                  )}
                  {groupSatisfied && (
                    <span className="text-flame" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </legend>

                <div className="grid grid-cols-2 gap-2">
                  {group.combo_option_choices
                    .filter((choice) => choice.is_available)
                    .map((choice) => {
                      const isSelected = selectedForGroup.includes(choice.id);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() =>
                            toggleChoice(group.id, choice.id, group.max_select)
                          }
                          aria-pressed={isSelected}
                          className={`font-body text-sm px-4 py-3 rounded-sm border-2 transition-colors text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2 ${
                            isSelected
                              ? "bg-flame border-flame text-bone"
                              : "bg-transparent border-bone/20 text-bone/80 hover:border-bone/50"
                          }`}
                        >
                          {choice.name}
                          {choice.price_delta > 0 && (
                            <span className="block font-utility text-xs opacity-80">
                              +R{choice.price_delta}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="p-6 border-t border-bone/10 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="font-body font-semibold text-bone/70 px-6 py-3 rounded-sm border-2 border-bone/20 hover:border-bone/50 transition-colors flex-1 focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!valid}
            className="font-body font-bold text-bone px-6 py-3 rounded-sm bg-flame flex-1 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-ember transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-char focus-visible:outline-offset-2"
          >
            {valid ? "Add to Order" : `Select ${missingGroups[0] ?? "options"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
