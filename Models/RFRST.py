import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np
import scipy.stats as stats

# Loading the training data
train_df = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\train_set.csv')

# Separating features and target variable for training data
X_train = train_df.drop(columns=['total_crimes']).copy()
y_train = train_df['total_crimes'].copy()

# Loading testing data
test_df = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\test_set.csv')

# Separating features and target variable for testing data
X_test = test_df.drop(columns=['total_crimes']).copy()
y_test = test_df['total_crimes'].copy()

# Initialising Random Forest Regressor with optimised parameters obtained from Optuna
best_rf = RandomForestRegressor(n_estimators=1857, min_samples_split=6, min_samples_leaf=2,
                                 max_features=None, max_depth=90, bootstrap=True, random_state=0, oob_score=True)

# Fitting the model on the training data
best_rf.fit(X_train, y_train)

# Predictions on the training set
predictions_train = best_rf.predict(X_train)

# Predictions on the test set
predictions_test = best_rf.predict(X_test)

# Adding the predictions to the test_df
test_df['rf_prediction'] = predictions_test

# Saving predictions as a CSV
test_df.to_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\Model Predictions\\random_forest_predictions.csv', index=False)

# Evaluating test set results
test_mse = mean_squared_error(y_test, predictions_test)
test_rmse = np.sqrt(test_mse)
test_mae = mean_absolute_error(y_test, predictions_test)
test_r2 = r2_score(y_test, predictions_test)
test_corr = np.corrcoef(y_test, predictions_test)[0, 1]

# Printing test set metrics
print(f'Mean Squared Error (MSE): {test_mse:.2f}')
print(f'Root Mean Squared Error (RMSE): {test_rmse:.2f}')
print(f'Mean Absolute Error (MAE): {test_mae:.2f}')
print(f'R-squared: {test_r2:.2f}')
print(f'Correlation coefficient (R): {test_corr:.2f}')

# Plotting Actual vs Predicted Values (Test Set)
plt.figure(figsize=(20, 6))
plt.subplot(1, 3, 1)
plt.scatter(y_test, predictions_test, color='blue', alpha=0.5, label='Actual vs Predicted Values')
plt.plot([min(y_test), max(y_test)], [min(y_test), max(y_test)], linestyle='--', color='red', label='Perfect Prediction Line')
plt.title('Actual vs Predicted Values (Test Set)')
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.grid(True)
plt.legend()

# Plotting Residuals vs Actual Values (Test Set)
residuals = y_test - predictions_test
plt.figure(figsize=(6, 6))
plt.scatter(y_test, residuals, color='blue', alpha=0.5)
plt.axhline(y=0, color='red', linestyle='--')
plt.title('Residuals vs Actual Values')
plt.xlabel('Actual Values')
plt.ylabel('Residuals')
plt.grid(True)

# Plotting Histogram of Residuals (Test Set)
plt.figure(figsize=(6, 6))
plt.hist(residuals, bins=30, color='blue', alpha=0.5)
plt.title('Histogram of Residuals')
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.grid(True)

plt.tight_layout()
plt.show()