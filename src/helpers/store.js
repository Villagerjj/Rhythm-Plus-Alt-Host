import Vue from "vue";
import Vuex from "vuex";
import * as fb from "./firebaseConfig";
import md5 from "js-md5";

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    audio: null,
    currentUser: null,
    userProfile: {},
    profilePicture: null,
  },
  actions: {
    fetchUserProfile() {
      this.dispatch("updateUserProfile");
      this.dispatch("fetchProfilePicture");
    },
    async fetchProfilePicture({ commit, state }) {
      if (state.currentUser) {
        let url = state.currentUser.photoURL;
        if (url) {
          commit("setProfilePciture", url);
        } else {
          let hash = md5(state.currentUser.email);
          let gravatar_link =
            "http://www.gravatar.com/avatar/" + hash + "?s=50&d=404";
          let response = await fetch(gravatar_link);
          if (response.status === 200) {
            commit("setProfilePciture", gravatar_link);
          } else {
            commit("setProfilePciture", null);
          }
        }
      }
    },
    updateUserProfile({ commit, state }) {
      if (state.currentUser) {
        fb.usersCollection
          .doc(state.currentUser.uid)
          .get()
          .then((res) => {
            commit("setUserProfile", res.data());
          })
          .catch((err) => {
            console.error(err);
          });
      }
    },
  },
  mutations: {
    setCurrentUser(state, val) {
      state.currentUser = val;
    },
    setUserProfile(state, val) {
      state.userProfile = val;
      if (val && val.exp) {
        let level = calculateUserLevel(val.exp);
        state.userProfile.lvBefore = state.userProfile.lv ?? level;
        state.userProfile.lv = level;
        state.userProfile.lvd = Math.floor(level);
      }
    },
    setProfilePciture(state, val) {
      state.profilePicture = val;
    },
    setAudio(state, val) {
      state.audio = val;
    },
  },
});

function calculateUserLevel(exp) {
  //ref https://stackoverflow.com/questions/6954874/
  const lvInc = 25;
  return (Math.sqrt(lvInc * lvInc + 100 * exp) - lvInc) / 50;
}

// partly ref https://savvyapps.com/blog/definitive-guide-building-web-app-vuejs-firebase
