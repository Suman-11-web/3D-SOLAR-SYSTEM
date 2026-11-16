export interface TabItem {
  id: string;
  label: string;
}

export class Tabs {
  public el: HTMLElement;
  private buttons = new Map<string, HTMLButtonElement>();

  constructor(
    items: TabItem[],
    activeId: string,
    onSelect: (id: string) => void
  ) {
    this.el = document.createElement('div');
    this.el.className = 'ui-tabs-header interactive';
    this.el.setAttribute('role', 'tablist');

    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ui-tab-btn';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(item.id === activeId));
      btn.textContent = item.label;

      btn.addEventListener('click', () => {
        this.setActive(item.id);
        onSelect(item.id);
      });

      this.buttons.set(item.id, btn);
      this.el.appendChild(btn);
    }
  }

  public setActive(id: string): void {
    this.buttons.forEach((btn, key) => {
      btn.setAttribute('aria-selected', String(key === id));
    });
  }
}
