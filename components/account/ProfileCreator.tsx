"use client";

import { useActionState } from "react";
import { createProfile, type ActionState } from "@/app/account/actions";
import { AVATAR_KEYS, type AvatarKey } from "@/lib/profile";
import AvatarBadge from "./AvatarBadge";

const initialState: ActionState = {};

export default function ProfileCreator() {
  const [state, action, pending] = useActionState(createProfile, initialState);
  return (
    <form action={action} className="border-t border-ink/10 pt-7">
      <h2 className="text-[19px] font-medium">Add a child profile</h2>
      <p className="mt-2 text-[14px] leading-6 text-ink/60">Use a first name or nickname. No email, date of birth or photograph is needed.</p>
      <label className="mt-5 block">
        <span className="mb-2 block text-[14px] font-medium">Name or nickname</span>
        <input name="displayName" required maxLength={30} autoComplete="off" className="min-h-[50px] w-full rounded-xl border border-ink/20 bg-surface px-4 text-[16px]" />
      </label>
      <fieldset className="mt-5">
        <legend className="mb-3 text-[14px] font-medium">Choose an icon</legend>
        <div className="flex flex-wrap gap-3">
          {AVATAR_KEYS.map((avatar, index) => (
            <label key={avatar} className="cursor-pointer">
              <input type="radio" name="avatarKey" value={avatar} defaultChecked={index === 0} className="peer sr-only" />
              <span className="inline-flex rounded-full p-1 peer-checked:ring-2 peer-checked:ring-brand-blue peer-checked:ring-offset-2 peer-checked:ring-offset-paper">
                <AvatarBadge avatar={avatar as AvatarKey} />
              </span>
              <span className="sr-only">{avatar}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.message && <p role="alert" className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-[14px]">{state.message}</p>}
      {state.success && <p role="status" className="mt-4 rounded-xl bg-sage/15 px-4 py-3 text-[14px]">{state.success}</p>}
      <button type="submit" disabled={pending} className="mt-5 min-h-[48px] rounded-xl bg-brand-blue px-5 font-medium text-paper disabled:opacity-60">
        {pending ? "Creating…" : "Create profile"}
      </button>
    </form>
  );
}
