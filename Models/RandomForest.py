import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV
import numpy as np

# Load the training data
train_df = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Separate features and target variable for training data
X_train = train_df.drop(columns=['total_crimes']).copy()
y_train = train_df['total_crimes'].copy()

# Define the parameter grid for random search
param_dist = {
    'n_estimators': [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000],
    'max_depth': [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4],
    'bootstrap': [True, False],
    'max_features': ['auto', 'sqrt']
}

# Create a Random Forest regressor
rf_regressor = RandomForestRegressor(random_state=0)

# Perform random search cross-validation
random_search = RandomizedSearchCV(estimator=rf_regressor, param_distributions=param_dist, 
                                   n_iter=3960, scoring='neg_mean_squared_error', cv=5, n_jobs=-1, 
                                   random_state=0)
random_search.fit(X_train, y_train)

# Get the best estimator from the random search 
best_rf = random_search.best_estimator_

# Making predictions on the training data
predictions_train = best_rf.predict(X_train)

# Evaluating the model on the training data
mse_train = mean_squared_error(y_train, predictions_train)
print(f'Training Set Mean Squared Error: {mse_train}')

r2_train = r2_score(y_train, predictions_train)
print(f'Training Set R-squared: {r2_train}')

# Print the best hyperparameters found
print("Best Hyperparameters:", random_search.best_params_)
--Training Set Mean Squared Error: 68.51731819564387
Training Set R-squared: 0.9792261077875182

#Best Hyperparameters: {'n_estimators': 2000, 'min_samples_split': 5, 'min_samples_leaf': 2, 'max_features': None, 'max_depth': 20, 'bootstrap': True}