/**
 * Buttons shared by the cards under a message: link preview, player and inline image cards.
 */
import { useTranslation } from "react-i18next";
import { openInBrowser } from "./openLink";
import { canonicalVideoUrl } from "./videoLink";

export function DismissButton({
  onDismiss,
  tabIndex,
}: {
  onDismiss: () => void;
  tabIndex: number;
}) {
  const { t } = useTranslation("chat");
  return (
    <button
      type="button"
      className="link-card__dismiss"
      tabIndex={tabIndex}
      aria-label={t("preview.dismiss")}
      data-tooltip={t("preview.dismiss")}
      onClick={onDismiss}
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}

interface OpenButtonProps {
  url: string;
  title: string;
  tabIndex: number;
  className?: string;
}

export function OpenButton({
  url,
  title,
  tabIndex,
  className = "link-card__open",
}: OpenButtonProps) {
  const { t } = useTranslation("chat");
  return (
    <button
      type="button"
      className={className}
      tabIndex={tabIndex}
      aria-label={t("preview.openLabel", { title })}
      onClick={() => {
        openInBrowser(url);
      }}
    >
      {t("preview.open")}
    </button>
  );
}

interface CopyLinkButtonProps {
  url: string;
  tabIndex: number;
  /** The message's copy path, so the confirmation shows in the chat's live region. */
  onCopy: (text: string) => void;
}

/**
 * "Copy link" for a card (issue #419). The player runs in a page of its own, where the clipboard
 * is closed, so copying has to come from Mumcord: the canonical video address, without the
 * parameters the player adds.
 */
export function CopyLinkButton({ url, tabIndex, onCopy }: CopyLinkButtonProps) {
  const { t } = useTranslation("chat");
  return (
    <button
      type="button"
      className="link-card__copy"
      tabIndex={tabIndex}
      onClick={() => {
        onCopy(canonicalVideoUrl(url));
      }}
    >
      {t("linkMenu.copy")}
    </button>
  );
}
