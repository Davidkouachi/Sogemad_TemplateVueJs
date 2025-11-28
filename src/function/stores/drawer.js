import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDrawerStore = defineStore('drawer', () => {
  const loading = ref(false);
  const icon = ref(null);
  const header = ref('Titre');
  const position = ref('right');
  const width = ref('30rem');
  const component = ref(null); // 🔥 Le composant à afficher
  const props = ref({});       // 🔥 Les props du composant
  const propsBtnFotter = ref({}); 

  function show(
    title = null , 
    icone = null, 
    pos = 'right', 
    w = '30rem', 
    comp = null, 
    compProps = {}, 
    footerProps = {},
    ) {
    loading.value = true;
    header.value = title;
    icon.value = icone;
    position.value = pos;
    width.value = w;
    component.value = comp;
    props.value = compProps;
    propsBtnFotter.value = footerProps;
  }

  function hide() {
    loading.value = false;
    icon.value = null;
    header.value = 'Titre';
    position.value = 'right';
    width.value = '30rem';
    component.value = null;
    props.value = {};
    propsBtnFotter.value = {};
  }

  return {
    loading,
    icon,
    header,
    position,
    width,
    component,
    props,
    propsBtnFotter,
    show,
    hide,
  };
});
