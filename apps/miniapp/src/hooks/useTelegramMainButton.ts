import { useEffect, useRef } from 'react';
import { mainButton } from '../lib/telegram';

export function useTelegramMainButton(
  label: string,
  onClick: () => void,
  options: { enabled?: boolean; visible?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const visible = options.visible ?? true;
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    try {
      if (!mainButton.setParams.isAvailable()) return undefined;
      mainButton.setParams({
        text: label,
        isEnabled: enabled,
        isVisible: visible,
        hasShineEffect: enabled,
      });
      const off = mainButton.onClick(() => onClickRef.current());
      return () => {
        off();
        mainButton.setParams({ isVisible: false });
      };
    } catch {
      return undefined;
    }
  }, [label, enabled, visible]);
}
