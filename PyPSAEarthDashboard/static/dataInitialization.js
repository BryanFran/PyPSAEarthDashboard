/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
  loadNominalGeneratorCapacityData,
  loadOptimalGeneratorCapacityData,
  loadNominalStorageCapacityData,
  loadOptimalStorageCapacityData,
  loadLineData,
} from './dataLoaders.js';

export function initializeDataLoading() {
  document.addEventListener("DOMContentLoaded", function () {
    loadNominalGeneratorCapacityData();
    loadOptimalGeneratorCapacityData();
    loadNominalStorageCapacityData();
    loadOptimalStorageCapacityData();
    loadLineData();
  });
}
