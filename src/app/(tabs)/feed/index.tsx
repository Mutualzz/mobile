import { FeedSnapScreen } from "@components/Feed/FeedSnapScreen";
import { observer } from "mobx-react-lite";

const FeedIndexScreen = () => <FeedSnapScreen variant="for-you" />;

export default observer(FeedIndexScreen);
