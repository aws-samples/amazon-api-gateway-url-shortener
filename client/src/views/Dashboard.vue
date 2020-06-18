<!-- Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. -->

<template>
  <div class="dashboard">
    <div class="columns is-mobile">
      <div class="column">
        <h1 class="title">Shortcuts</h1>
      </div>
      <div class="column is-2-desktop is-half-mobile">
        <button
          class="button is-info is-outlined is-fullwidth"
          v-on:click="toggleModal('create')"
        >
          New Shortcut
        </button>
      </div>
    </div>

    <div class="columns is-multiline">
      <div
        class="column is-one-third"
        v-for="(link, i) in links"
        v-bind:key="link.id"
      >
        <div class="card">
          <header class="card-header has-background-info">
            <p class="card-header-title has-text-white">
              {{ link.id }}
            </p>
            <a href="#" class="card-header-icon" aria-label="more options">
              <span class="icon">
                <i class="fas fa-angle-down" aria-hidden="true"></i>
              </span>
            </a>
          </header>
          <div class="card-content">
            <div class="content">
              <div class="text-clip" :title="link.url">
                {{ link.url }}
              </div>
              <div class="is-size-7">
                <time>{{ link.timestamp | formatDate }}</time>
              </div>
            </div>
          </div>
          <footer class="card-footer">
            <a
              v-on:click="toggleModal('edit', link, i)"
              href="#"
              class="card-footer-item"
              >Edit</a
            >
            <a
              v-on:click="deleteLink(link.id, i)"
              href="#"
              class="card-footer-item"
              >Delete</a
            >
            <a
              target="_blank"
              :href="apiUrl + '/' + link.id"
              class="card-footer-item"
              >Try it</a
            >
          </footer>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal" v-bind:class="{ 'is-active': modalIsActive }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <span v-if="modalTypeCreate">Create</span>
            <span v-else>Update</span> Sliplink
          </p>
          <button
            class="delete"
            v-on:click="toggleModal()"
            aria-label="close"
          ></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <div class="control">
              <input
                class="input"
                v-model="model.id"
                type="text"
                placeholder="Short Link"
                required
                :disabled="!modalTypeCreate"
              />
            </div>
          </div>
          <div class="field">
            <div class="control">
              <input
                class="input"
                v-model="model.url"
                type="text"
                placeholder="Url (Ex: http://mylink.com)"
                required
              />
            </div>
          </div>
          <p class="is-italic has-text-info is-size-7" v-if="!modalTypeCreate">
            Note: Updates take a minimum of 5 minutes to propogate. You may also
            need to clear your local cache.
          </p>
        </section>
        <footer class="modal-card-foot">
          <button
            v-if="modalTypeCreate"
            v-on:click="createLink()"
            class="button is-success"
          >
            Create
          </button>
          <button v-else v-on:click="updateLink()" class="button is-success">
            Update
          </button>
          <button class="button" v-on:click="toggleModal()">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";

export default {
  name: "dashboard",
  data() {
    return {
      apiUrl: process.env.VUE_APP_API_ROOT,
      modalIsActive: false,
      model: {
        id: "",
        url: "",
      },
      currentLink: {},
      currentIndex: 0,
      modalTypeCreate: true,
    };
  },
  created() {
    this.fetchData();
  },
  computed: {
    ...mapState(["links"]),
  },
  methods: {
    toggleModal: function (type, link = null, ind = 0) {
      this.model.id = this.model.url = ""; // hacky reset
      this.modalTypeCreate = type === "create";
      this.modalIsActive = !this.modalIsActive;

      if (type === "edit") {
        this.currentLink = link;
        this.currentIndex = ind;
        this.model.id = link.id;
        this.model.url = link.url;
      }
    },
    fetchData: function () {
      axios
        .get(`${this.apiUrl}/app`, {
          headers: {
            Authorization: window.localStorage.getItem("cognitoIdentityToken"),
          },
        })
        .then((response) => this.$store.commit("hydrateLinks", response.data))
        .catch(() => this.$store.commit("drainLinks"));
    },
    createLink: function () {
      let that = this;
      axios
        .post(`${that.apiUrl}/app`, that.model, {
          headers: {
            Authorization: window.localStorage.getItem("cognitoIdentityToken"),
          },
        })
        .then((response) => {
          if (response.data.error) {
            alert(response.data.message);
          } else {
            that.toggleModal();
            that.$store.commit("addLink", response.data);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line
          console.log(`POST to ${that.apiUrl}/app caught error ${err}`);
          alert("SlipLink cannot be created. Bad format.");
        });
    },
    updateLink: function () {
      let that = this;
      that.currentLink.url = that.model.url;
      axios
        .put(`${that.apiUrl}/app/${that.currentLink.id}`, that.currentLink, {
          headers: {
            Authorization: window.localStorage.getItem("cognitoIdentityToken"),
          },
        })
        .then((response) => {
          if (response.status === 200) {
            that.toggleModal();
            that.$store.commit("updateLink", response.data, that.currentIndex);
          } else {
            alert("There was an issue deleting your SlipLink");
          }
        })
        .catch(() => {
          alert("There was an issue deleting your SlipLink");
        });
    },
    deleteLink: function (id, ind) {
      if (confirm(`Are you sure you want to delete '${id}'`)) {
        let that = this;
        axios
          .delete(`${that.apiUrl}/app/${id}`, {
            headers: {
              Authorization: window.localStorage.getItem(
                "cognitoIdentityToken"
              ),
            },
          })
          .then((response) => {
            if (response.status === 200) {
              that.$store.commit("removeLink", ind);
            } else {
              alert("There was an issue deleting your SlipLink");
            }
          })
          .catch((err) => {
            alert(err);
          });
      }
    },
  },
};
</script>
