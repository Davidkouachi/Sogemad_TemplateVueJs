<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { usePreloaderStore } from "@/function/stores/preloader";
import { useBreadcrumbMenuStore } from '@/function/stores/breadcrumbMenu';
import { model, findBreadcrumb } from '@/layout/composables/menuUtils';

const preloader = usePreloaderStore();
const route = useRoute();

const breadcrumbMenu = useBreadcrumbMenuStore();

const { layoutState, setActiveMenuItem, toggleMenu } = useLayout();

const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  },
  index: {
    type: Number,
    default: 0
  },
  root: {
    type: Boolean,
    default: true
  },
  parentItemKey: {
    type: String,
    default: null
  },
  model: {
    type: Array,
    default: () => []
  },
  findBreadcrumb: {
    type: Function,
    default: null
  }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

// onBeforeMount(() => {
//     itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

//     const activeItem = layoutState.activeMenuItem;

//     isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
// });

onBeforeMount(() => {
    itemKey.value = props.parentItemKey
        ? props.parentItemKey + '-' + props.index
        : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    // Active normal
    isActiveMenu.value =
        activeItem === itemKey.value ||
        (activeItem ? activeItem.startsWith(itemKey.value + '-') : false);

    // 🔥 Correction : ouvrir automatiquement le menu si la route correspond
    if (props.item.to && props.item.to === route.path) {
        setActiveMenuItem(itemKey.value);
        isActiveMenu.value = true;
    }

    // 🔥 Correction : si un enfant correspond à la route → ouvrir le parent
    if (props.item.items) {
        const hasActiveChild = props.item.items.some(child => child.to === route.path);

        if (hasActiveChild) {
            setActiveMenuItem(itemKey.value);
            isActiveMenu.value = true;
        }
    }
});


watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);

function itemClick(event, item) {

    if (item.disabled) {
        event.preventDefault();
        return;
    }
    
    // preloader.show();
    // console.log(preloader.loading)

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        toggleMenu();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);

    // 🔥 Mise à jour du breadcrumb
    // if (item.to) {
    //     const path = findBreadcrumb(model.value, item.to);
    //     console.log(item.to)
    //     if (path) {
    //         breadcrumbMenu.set([
    //             { icon: 'pi pi-home', to: '/' },
    //             ...path.map(i => ({ label: i.label, to: i.to, icon: i.icon }))
    //         ]);
    //     }
    // }
}

function checkActiveRoute(item) {
    return route.path === item.to;
}
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss">
// /* Texte des items */
.layout-menuitem-root-text,
.layout-menuitem-text,
.layout-submenu-toggler,
.layout-menuitem-icon {
    color: #fff !important;
}

// /* Hover sur tous les liens et router-links */
.layout-menuitem-root > a:hover,
.layout-menuitem-root > router-link:hover,
.layout-submenu > li > a:hover,
.layout-submenu > li > router-link:hover {
    background-color: #fff !important;
    color: #6366f1 !important;
}

.layout-menuitem-root > a:hover .layout-menuitem-text,
.layout-menuitem-root > router-link:hover .layout-menuitem-text,
.layout-submenu > li > a:hover .layout-menuitem-text,
.layout-submenu > li > router-link:hover .layout-menuitem-text {
    color: #6366f1 !important;
}

// /* Active uniquement sur le lien exact (pas le parent) */
.active-route {
    background-color: #fff !important;
    color: #6366f1 !important;
}

 // Sous-menu texte 
.layout-submenu .layout-menuitem-text {
    color: #fff;
}

 // Pour les icônes si tu veux changer aussi 
/* Activer couleur pour icône ET texte quand le route-link est actif */
.active-route {
    color: #6366f1 !important;

    i,
    .layout-menuitem-text {
        color: #6366f1 !important;
    }
}
</style>


