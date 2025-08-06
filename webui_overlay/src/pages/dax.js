class DaxPage {
  constructor() {
    this.data = {
      profiles: [],
      currentProfile: null,
      loading: false,
      xmlContent: null
    };
    this.eventListeners = [];
    this.isInitialized = false;
  }

  async render() {
    return `
      <div class="dax-page">
        <div class="page-header">
          <h2>${window.i18n.t('daxPage.title')}</h2>
          <p>${window.i18n.t('daxPage.description')}</p>
        </div>

        <div class="cards">
          <div class="profile-card">
            <h3>${window.i18n.t('daxPage.profileCard.title')}</h3>
            <p>${window.i18n.t('daxPage.profileCard.description')}</p>
            
            <label>
              <span>${window.i18n.t('daxPage.profileCard.currentProfile')}</span>
              <select id="profile-select">
                <option value="">${window.i18n.t('daxPage.profileCard.loading')}</option>
              </select>
            </label>

            <fieldset>
              <button class="tonal" id="load-config">${window.i18n.t('daxPage.profileCard.loadConfig')}</button>
              <button class="outlined" id="save-config">${window.i18n.t('daxPage.profileCard.saveConfig')}</button>
            </fieldset>
          </div>

          <div class="equalizer-card">
            <h3>${window.i18n.t('daxPage.equalizerCard.title')}</h3>
            <p>${window.i18n.t('daxPage.equalizerCard.description')}</p>
            
            <div class="switches">
              <label>
                <span>${window.i18n.t('daxPage.equalizerCard.enable')}</span>
                <input type="checkbox" id="geq-enable">
              </label>
            </div>

            <div id="eq-bands" class="eq-container">
              <!-- 均衡器频段将在这里动态生成 -->
            </div>

            <fieldset>
              <button class="tonal" id="reset-eq">${window.i18n.t('daxPage.equalizerCard.reset')}</button>
              <button class="outlined" id="preset-flat">${window.i18n.t('daxPage.equalizerCard.presetFlat')}</button>
              <button class="outlined" id="preset-bass">${window.i18n.t('daxPage.equalizerCard.presetBass')}</button>
            </fieldset>
          </div>

          <div class="audio-effects-card">
            <h3>${window.i18n.t('daxPage.audioEffectsCard.title')}</h3>
            <p>${window.i18n.t('daxPage.audioEffectsCard.description')}</p>

            <div class="switches">
              <label>
                <span>${window.i18n.t('daxPage.audioEffectsCard.virtualizer')}</span>
                <input type="checkbox" id="virtualizer-enable">
              </label>
              
              <label>
                <span>${window.i18n.t('daxPage.audioEffectsCard.bassEnhancer')}</span>
                <input type="checkbox" id="bass-enhancer-enable">
              </label>
              
              <label>
                <span>${window.i18n.t('daxPage.audioEffectsCard.dialogEnhancer')}</span>
                <input type="checkbox" id="dialog-enhancer-enable">
              </label>
              
              <label>
                <span>${window.i18n.t('daxPage.audioEffectsCard.volumeLeveler')}</span>
                <input type="checkbox" id="volume-leveler-enable">
              </label>
            </div>

            <label>
              <span>${window.i18n.t('daxPage.audioEffectsCard.surroundBoost')}</span>
              <input type="range" id="surround-boost" min="0" max="255" value="128">
              <span id="surround-boost-value">128</span>
            </label>

            <label>
              <span>${window.i18n.t('daxPage.audioEffectsCard.dialogAmount')}</span>
              <input type="range" id="dialog-enhancer-amount" min="0" max="10" value="4">
              <span id="dialog-enhancer-amount-value">4</span>
            </label>
          </div>

          <div class="device-settings-card">
            <h3>${window.i18n.t('daxPage.deviceSettingsCard.title')}</h3>
            <p>${window.i18n.t('daxPage.deviceSettingsCard.description')}</p>

            <label>
              <span>${window.i18n.t('daxPage.deviceSettingsCard.deviceType')}</span>
              <select id="endpoint-type">
                <option value="speaker">${window.i18n.t('daxPage.deviceSettingsCard.speaker')}</option>
                <option value="headphone">${window.i18n.t('daxPage.deviceSettingsCard.headphone')}</option>
                <option value="other">${window.i18n.t('daxPage.deviceSettingsCard.other')}</option>
              </select>
            </label>

            <div class="switches">
              <label>
                <span>${window.i18n.t('daxPage.deviceSettingsCard.ieqEnable')}</span>
                <input type="checkbox" id="ieq-enable">
              </label>
            </div>

            <label>
              <span>${window.i18n.t('daxPage.deviceSettingsCard.volmaxBoost')}</span>
              <input type="range" id="volmax-boost" min="0" max="255" value="48">
              <span id="volmax-boost-value">48</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  async onShow() {
    if (!this.isInitialized) {
      await this.initializePage();
      this.isInitialized = true;
    }
    
    this.setupEventListeners();
    await this.loadConfiguration();
  }

  async initializePage() {
    // 初始化均衡器频段
    this.createEqualizerBands();
  }

  createEqualizerBands() {
    const eqContainer = document.getElementById('eq-bands');
    if (!eqContainer) return;

    const frequencies = [47, 141, 234, 328, 469, 656, 844, 1031, 1313, 1688, 2250, 3000, 3750, 4688, 5813, 7125, 9000, 11250, 13875, 19688];
    
    eqContainer.innerHTML = frequencies.map(freq => `
      <div class="eq-band">
        <label>
          <span>${freq < 1000 ? freq + 'Hz' : (freq/1000).toFixed(1) + 'kHz'}</span>
          <input type="range" id="eq-${freq}" min="-12" max="12" value="0" step="0.1">
          <span id="eq-${freq}-value">0.0dB</span>
        </label>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // 配置文件选择
    const profileSelect = document.getElementById('profile-select');
    if (profileSelect) {
      profileSelect.onchange = () => this.onProfileChange();
    }

    // 加载和保存按钮
    const loadBtn = document.getElementById('load-config');
    const saveBtn = document.getElementById('save-config');
    
    if (loadBtn) {
      loadBtn.onclick = () => this.loadConfiguration();
    }
    
    if (saveBtn) {
      saveBtn.onclick = () => this.saveConfiguration();
    }

    // 均衡器控制
    const geqEnable = document.getElementById('geq-enable');
    if (geqEnable) {
      geqEnable.onchange = () => this.toggleEqualizer();
    }

    // 均衡器预设
    document.getElementById('reset-eq')?.addEventListener('click', () => this.resetEqualizer());
    document.getElementById('preset-flat')?.addEventListener('click', () => this.applyPreset('flat'));
    document.getElementById('preset-bass')?.addEventListener('click', () => this.applyPreset('bass'));

    // 音频效果开关
    ['virtualizer-enable', 'bass-enhancer-enable', 'dialog-enhancer-enable', 'volume-leveler-enable', 'ieq-enable'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.onchange = () => this.updateAudioEffect(id, element.checked);
      }
    });

    // 滑块控制
    ['surround-boost', 'dialog-enhancer-amount', 'volmax-boost'].forEach(id => {
      const slider = document.getElementById(id);
      const valueSpan = document.getElementById(id + '-value');
      if (slider && valueSpan) {
        slider.oninput = () => {
          valueSpan.textContent = slider.value;
          this.updateSliderValue(id, slider.value);
        };
      }
    });

    // 均衡器频段滑块
    const frequencies = [47, 141, 234, 328, 469, 656, 844, 1031, 1313, 1688, 2250, 3000, 3750, 4688, 5813, 7125, 9000, 11250, 13875, 19688];
    frequencies.forEach(freq => {
      const slider = document.getElementById(`eq-${freq}`);
      const valueSpan = document.getElementById(`eq-${freq}-value`);
      if (slider && valueSpan) {
        slider.oninput = () => {
          valueSpan.textContent = parseFloat(slider.value).toFixed(1) + 'dB';
          this.updateEqualizerBand(freq, slider.value);
        };
      }
    });

    // 设备类型选择
    const endpointType = document.getElementById('endpoint-type');
    if (endpointType) {
      endpointType.onchange = () => this.onEndpointTypeChange();
    }
  }

  async loadConfiguration() {
    try {
      this.data.loading = true;
      window.core.showToast(window.i18n.t('daxPage.messages.loadingConfig'), 'info');

      const result = await window.core.exec('cat "/data/vendor/etc/dolby/dax-default.xml"');
      if (result.success) {
        this.data.xmlContent = result.stdout;
        this.parseXMLConfiguration();
        window.core.showToast(window.i18n.t('daxPage.messages.loadSuccess'), 'success');
      } else {
        throw new Error(result.stderr || window.i18n.t('daxPage.messages.loadError'));
      }
    } catch (error) {
      window.core.showError(window.i18n.t('daxPage.messages.loadError') + ': ' + error.message, 'DAX配置');
    } finally {
      this.data.loading = false;
    }
  }

  parseXMLConfiguration() {
    // 简化的XML解析，实际应用中可能需要更复杂的解析逻辑
    if (!this.data.xmlContent) return;

    // 解析配置文件列表
    const profileMatches = this.data.xmlContent.match(/<profile id="(\d+)" name="([^"]+)"/g);
    if (profileMatches) {
      this.data.profiles = profileMatches.map(match => {
        const idMatch = match.match(/id="(\d+)"/);
        const nameMatch = match.match(/name="([^"]+)"/);
        return {
          id: idMatch ? idMatch[1] : '',
          name: nameMatch ? nameMatch[1] : ''
        };
      });
      
      this.updateProfileSelect();
    }
  }

  updateProfileSelect() {
    const select = document.getElementById('profile-select');
    if (!select) return;

    select.innerHTML = this.data.profiles.map(profile => 
      `<option value="${profile.id}">${profile.name}</option>`
    ).join('');

    if (this.data.profiles.length > 0) {
      this.data.currentProfile = this.data.profiles[0].id;
      select.value = this.data.currentProfile;
    }
  }

  async saveConfiguration() {
    try {
      window.core.showToast(window.i18n.t('daxPage.messages.savingConfig'), 'info');
      
      // 这里应该实现将修改后的配置写回XML文件的逻辑
      // 由于XML操作比较复杂，这里只是示例
      
      const confirmed = await window.DialogManager.showConfirm(
        window.i18n.t('daxPage.profileCard.saveConfig'), 
        window.i18n.t('daxPage.messages.saveConfirm')
      );
      
      if (confirmed) {
        // 实际的保存逻辑
        window.core.showToast(window.i18n.t('daxPage.messages.saveSuccess'), 'success');
      }
    } catch (error) {
      window.core.showError(window.i18n.t('daxPage.messages.saveError') + ': ' + error.message, 'DAX配置');
    }
  }

  onProfileChange() {
    const select = document.getElementById('profile-select');
    if (select) {
      this.data.currentProfile = select.value;
      window.core.showToast(`${window.i18n.t('daxPage.messages.profileSwitched')}: ${select.options[select.selectedIndex].text}`, 'info');
    }
  }

  toggleEqualizer() {
    const enabled = document.getElementById('geq-enable').checked;
    const eqContainer = document.getElementById('eq-bands');
    if (eqContainer) {
      eqContainer.style.opacity = enabled ? '1' : '0.5';
      eqContainer.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  resetEqualizer() {
    const frequencies = [47, 141, 234, 328, 469, 656, 844, 1031, 1313, 1688, 2250, 3000, 3750, 4688, 5813, 7125, 9000, 11250, 13875, 19688];
    frequencies.forEach(freq => {
      const slider = document.getElementById(`eq-${freq}`);
      const valueSpan = document.getElementById(`eq-${freq}-value`);
      if (slider && valueSpan) {
        slider.value = '0';
        valueSpan.textContent = '0.0dB';
      }
    });
    window.core.showToast(window.i18n.t('daxPage.messages.eqReset'), 'success');
  }

  applyPreset(preset) {
    const frequencies = [47, 141, 234, 328, 469, 656, 844, 1031, 1313, 1688, 2250, 3000, 3750, 4688, 5813, 7125, 9000, 11250, 13875, 19688];
    
    let values;
    if (preset === 'flat') {
      values = new Array(frequencies.length).fill(0);
    } else if (preset === 'bass') {
      // 低音增强预设
      values = [3, 2.5, 2, 1.5, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    frequencies.forEach((freq, index) => {
      const slider = document.getElementById(`eq-${freq}`);
      const valueSpan = document.getElementById(`eq-${freq}-value`);
      if (slider && valueSpan && values) {
        slider.value = values[index].toString();
        valueSpan.textContent = values[index].toFixed(1) + 'dB';
      }
    });

    const presetName = preset === 'flat' ? window.i18n.t('daxPage.messages.flatPreset') : window.i18n.t('daxPage.messages.bassPreset');
    window.core.showToast(window.i18n.t('daxPage.messages.presetApplied', { preset: presetName }), 'success');
  }

  updateAudioEffect(effectId, enabled) {
    window.core.logDebug(`音频效果 ${effectId} ${enabled ? '启用' : '禁用'}`, 'DAX');
  }

  updateSliderValue(sliderId, value) {
    window.core.logDebug(`滑块 ${sliderId} 值更新为: ${value}`, 'DAX');
  }

  updateEqualizerBand(frequency, gain) {
    window.core.logDebug(`均衡器频段 ${frequency}Hz 增益设置为: ${gain}dB`, 'DAX');
  }

  onEndpointTypeChange() {
    const select = document.getElementById('endpoint-type');
    if (select) {
      const deviceType = select.value;
      window.core.showToast(window.i18n.t('daxPage.messages.deviceSwitched', { device: select.options[select.selectedIndex].text }), 'info');
      // 根据设备类型加载不同的配置
    }
  }

  getPageActions() {
    return [
      {
        icon: 'refresh',
        title: window.i18n.t('daxPage.actions.reload'),
        action: () => this.loadConfiguration()
      },
      {
        icon: 'save',
        title: window.i18n.t('daxPage.actions.save'),
        action: () => this.saveConfiguration()
      }
    ];
  }

  cleanup() {
    // 清理事件监听器
    this.eventListeners.forEach(listener => {
      if (listener.element && listener.event && listener.handler) {
        listener.element.removeEventListener(listener.event, listener.handler);
      }
    });
    this.eventListeners = [];
  }
}

export { DaxPage };