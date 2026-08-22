"use client";

import { useActionState, useState } from "react";
import { renameProfile, type ActionState } from "@/app/account/actions";

const initialState: ActionState = {};

/**
 * Rename the child currently being read as.
 *
 * Collapsed to a single "Change name" button until asked for. This sits on
 * the screen a child sees when they open their own reading journey, and a
 * text box permanently next to their name invites fiddling rather than
 * reading. Opening it is one tap; the common case is not wanting it.
 */
export default function ProfileRenamer({
  profileId,
  currentName,
}: {
  profileId: string;
  currentName: string;
}) {
  const [state, action, pending] = useActionState(renameProfile, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-brand-blue min-h-[44px] text-[14px] underline-offset-4 hover:underline"
        >
          Change name
        </button>
        {state.success && (
          <p className="text-ink/60 mt-1 text-[14px]" role="status">
            {state.success}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="profileId" value={profileId} />
      <label className="block">
        <span className="text-ink/70 mb-1 block text-[14px] font-medium">
          Name or nickname
        </span>
        <input
          name="displayName"
          defaultValue={currentName}
          maxLength={30}
          required
          autoFocus
          className="border-ink/20 bg-surface min-h-[46px] w-full max-w-[280px] rounded-xl border px-4 text-[16px]"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-blue text-paper inline-flex min-h-[44px] items-center rounded-xl px-5 text-[14px] font-medium disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save name"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink/60 min-h-[44px] text-[14px] underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </div>

      {state.message && (
        <p className="text-ink/70 mt-2 text-[14px]" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
