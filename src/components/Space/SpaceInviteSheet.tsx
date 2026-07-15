import { SpaceCreate } from "@components/Space/SpaceCreate";
import { SpaceJoin } from "@components/Space/SpaceJoin";
import { useAppStore } from "@hooks/useStores";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

export const SpaceInviteSheet = observer(() => {
    const app = useAppStore();
    const [creating, setCreating] = useState(true);

    useEffect(() => {
        if (app.spaces.all.length === 0) setCreating(true);
    }, [app.spaces.all.length]);

    if (creating) return <SpaceCreate setCreating={setCreating} />;

    return <SpaceJoin setCreating={setCreating} />;
});
