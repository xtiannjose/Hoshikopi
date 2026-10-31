import {
  CarIcon,
  CigaretteIcon,
  CigaretteSlashIcon,
  DogIcon,
  PlugIcon,
  ToiletIcon,
  WheelchairIcon,
  WifiHighIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import type { Amenities } from "@/modules/cafe";

type Row = { icon: Icon; label: string; note?: string | null };

/** Facts about visiting; an unknown Amenity is left out (INFO-05). */
export function amenityRows(a: Amenities): Row[] {
  const rows: (Row | null)[] = [
    a.wifi === null
      ? null
      : {
          icon: WifiHighIcon,
          label: a.wifi ? "Free Wi-Fi" : "No Wi-Fi",
          note: a.wifi ? "Ask for the password at the bar." : null,
        },
    a.powerOutlets === null
      ? null
      : {
          icon: PlugIcon,
          label: a.powerOutlets ? "Power outlets" : "No power outlets",
          note: a.laptopNote,
        },
    a.petsAllowed === null
      ? null
      : {
          icon: DogIcon,
          label: a.petsAllowed ? "Dogs welcome" : "No pets",
          note: a.petsNote,
        },
    a.smokingAllowed === null
      ? null
      : {
          icon: a.smokingAllowed ? CigaretteIcon : CigaretteSlashIcon,
          label: a.smokingAllowed ? "Smoking area" : "No smoking",
        },
    a.restroom === null
      ? null
      : { icon: ToiletIcon, label: a.restroom ? "Restroom" : "No restroom" },
    a.stepFreeEntrance === null
      ? null
      : {
          icon: WheelchairIcon,
          label: a.stepFreeEntrance
            ? "Step-free entrance"
            : "A step at the door",
        },
    a.accessibleRestroom === null
      ? null
      : {
          icon: WheelchairIcon,
          label: a.accessibleRestroom
            ? "Accessible restroom"
            : "The restroom is not wheelchair accessible",
        },
    a.parkingNote
      ? { icon: CarIcon, label: "Parking", note: a.parkingNote }
      : null,
  ];
  return rows.filter((row) => row !== null);
}

export function AmenityList({ amenities }: { amenities: Amenities }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {amenityRows(amenities).map(({ icon: Icon, label, note }) => (
        <li key={label} className="flex gap-3">
          <Icon aria-hidden size={24} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">{label}</span>
            {note && (
              <span className="text-muted-foreground block">{note}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
