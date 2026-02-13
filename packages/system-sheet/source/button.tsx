"use client";

import { PrismButton } from "@ui";
import type { ColorName } from "@ui";
import {
  Calendar,
  Copy,
  Download,
  Filter,
  Link,
  Lock,
  Mail,
  Map,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ACTION_BUTTONS: { color: ColorName; label: string; icon: LucideIcon }[] =
  [
    { color: "red", label: "Download", icon: Download },
    { color: "pink", label: "Email", icon: Mail },
    { color: "purple", label: "Route", icon: MapPin },
    { color: "deepPurple", label: "Share", icon: Share2 },
    { color: "indigo", label: "Save", icon: Save },
    { color: "blue", label: "Add", icon: Plus },
    { color: "lightBlue", label: "Edit", icon: Pencil },
    { color: "cyan", label: "Delete", icon: Trash2 },
    { color: "teal", label: "Send", icon: Send },
    { color: "green", label: "Copy", icon: Copy },
    { color: "lightGreen", label: "Link", icon: Link },
    { color: "lime", label: "Play", icon: Play },
    { color: "yellow", label: "Pause", icon: Pause },
    { color: "amber", label: "Search", icon: Search },
    { color: "orange", label: "Filter", icon: Filter },
    { color: "deepOrange", label: "Calendar", icon: Calendar },
    { color: "brown", label: "Map", icon: Map },
    { color: "grey", label: "Lock", icon: Lock },
    { color: "blueGrey", label: "Star", icon: Star },
  ];

export function Button() {
  return (
    <div className="mb-8">
      <h3 className="mb-4">Buttons</h3>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-2">.plain</p>
          <div className="flex flex-wrap gap-3">
            {ACTION_BUTTONS.map(({ color, label }) => (
              <PrismButton
                key={color}
                color={color}
                label={label}
                variant="plain"
                asSpan
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">.icon</p>
          <div className="flex flex-wrap gap-3">
            {ACTION_BUTTONS.map(({ color, label, icon }) => (
              <PrismButton
                key={color}
                color={color}
                label={label}
                variant="icon"
                icon={icon}
                asSpan
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            .uppercase + .icon
          </p>
          <div className="flex flex-wrap gap-3">
            {ACTION_BUTTONS.map(({ color, label, icon }) => (
              <PrismButton
                key={color}
                color={color}
                label={label}
                variant="icon"
                icon={icon}
                uppercase
                asSpan
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
